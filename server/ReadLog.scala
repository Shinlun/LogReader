package org.your.server.resources

import unfiltered._
import unfiltered.netty._
import unfiltered.request._
import unfiltered.response._
import scala.io._
import scala.util.control._
import net.liftweb.json._
import net.liftweb.json.JsonDSL._

object ReadLog extends async.Plan
  with ServerErrorResponse {
    def intent = {
      case req @ Path("/logs") => req match                                                                     // Pattern matching on requested URL
        case GET(_) & Params(p) => req respond({                                                                // Checking HTTP method and presence of data
          val file = p("file").headOption match {
            case Some("production.log") => Some("logs/production.log")
            case Some("development.log") => Some("logs/development.log")
            case Some("access.log") => Some("logs/access.log")
            case Some("error.log") => Some("logs/error.log")
            case _ => None
          }
          file map { f =>
            var log = Source.fromFile(f)                                                                        // If we have a valid file we open it
            val logLines = log.count(_ == '\n')                                                                 // Getting the number of lines in that file
            log.close
            val tail = p("tail").headOption flatMap { t => Exception.allCatch.opt { t.toInt } }                 // If the query specifies we should return only the 't' (tail) last lines, we get that number
            val line = tail map { t =>
              logLines - t                                                                                      // Total number of lines - 't' indicates the line we should start reading at
            } getOrElse (p("line").headOption flatMap { l => Exception.allCatch.opt { l.toInt } } getOrElse 0)  // If no tail value is specified, check if a line number is, otherwise just start reading from line 0
            val drop = if(line > 0) {1} else {0}
            var i = 0
            Exception.allCatch.opt {
              var log = Source.fromFile(f)
              val text = log.dropWhile ({ c =>                                                                  // Start dropping unwanted lines
                  if(c == '\n') {
                    i += 1
                  } else {}
                  i < line
                }).drop(drop).mkString                                                                          // Getting result as a string
              log.close
              Ok ~> JsonContent ~> ResponseString(compact(render({                                              // Returning JSON object with the text and the total number of lines, allowing us to query from that number
                ("text" -> text) ~                                                                              // next time so we don't re-read the whole file everytime
                ("lines" -> logLines)
              })))
            } getOrElse BadRequest                                                                              // Returing error if we fail to read the file
          } getOrElse TeaPot  // <-- private joke, this should return NotFound =)
        })
        case _ => MethodNotAllowed
      }
    }
  }

package org.your.server

import resources._

/** embedded server */
object Server {
  def main(args: Array[String]) {
    unfiltered.netty.Http(1337)
      .handler(ReadLog)
      .run
  }
}

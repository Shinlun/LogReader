var interval = 0,
    line = 0,
    querying = false;

var readFile = function(file) {
  clearInterval(interval);                                         // reseting interval
  interval = setInterval(function() {
    if(!querying) {                                                // checking if there's no query being made
      querying = true;                                             // blocking other queries while this one isn't done
      if(line == 0) {
        var tail = $("#tail").val()                                // checking if user asked for a tailed display
      }
      $.ajax("http://example.org/api/logs", {                      // querying
        type: "GET",
        data: {
          file: file,
          line: line,
          tail: tail
        },
        success: function(response) {                               // response contains 2 pieces of data: number of lines in the file and file content
          $("#errors").html("");                                    // clearing previous errors if query was successful
          line = response.lines;
          if(response.text.length > 0) {
            $("#log").find(".last").removeClass("last");            // for css purpose (you can add a certain styling to the last loaded data)
            $("#log").append("<span class='last'>"
              + response.text.replace(/\b(?:http(s)?:\/\/|(www.))([^\s*]+)(?=\s|$)/g, '<a href="http$1://$2$3">$2$3</a>') // making links and email addresses clickable
                 .replace(/\n/g, "<br/>")
                 .replace(/([^\s]+@[\w-.]+)/g, '<a href="mailto:$1">$1</a>')
              + "</span>"
            );
            $("#log").scrollTop($("#log").prop("scrollHeight"));     // scroll to the bottom of the text display zone
          }
          $("#display").find(".lines").html("(" + line + " lines)"); // indicating the number of lines
          querying = false;                                          // allowing the next query to be made
        },
        error: function(errors) {
          clearInterval(interval);                                   // in case of error, we stop querying and check the error status to identify the problem
          if(errors.status == 400) {
            $("#errors").html("The file could not be found");
          } else if (errors.status == 418) {
            $("#errors").html("Nice try, but... I'm a TeaPot! ;-)"); // <- private joke, should be a 404 =)
          } else {
            $("#errors").html("Hmmm... Something wrong happened...");
          }
          querying = false;
        }
      });
    }
  }, 500);
}

$(document).ready(function() {                                       // adding events listeners to the UI
  var file = "",
      title = "",
      button = "",
      running = true;
  $(".reader").bind("click", function() {
    $("#stop").removeAttr("disabled");
    button = $(this).attr("id");
    switch(button) {
      case "production":
        file = "production.log";
        title = "Production logs";
      break;
      case "development":
        file = "development.log";
        title = "Development logs";
      break;
      case "access":
        file = "access.log";
        title = "Access logs";
      break;
      case "error":
        file = "error.log";
        title = "Error logs";
      break;
      default:
        file = "production.log";
        title = "Production logs";
      break;
    }
    if($("#display").find("h2").html() != title) {
      $("#display").find("h2").html(title);
      $("#log").html("");
      running = true;
      line = 0;
      $("#stop").attr("value", "Stop");
    }
    readFile(file);
  });

  $("#stop").bind("click", function(e) {
    if(running) {
      clearInterval(interval);
      $(this).attr("value", "Read Log");
    } else {
      $(this).attr("value", "Stop");
      $("#" + button).trigger("click");
    }
    running = !running;
  });
});

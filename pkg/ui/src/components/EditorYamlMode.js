import ace from 'brace'

ace.define("ace/mode/kube_yaml_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(acequire, exports, module) {
  
  var oop = acequire("../lib/oop")
  var TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules
  var KubeYamlHighlightRules = function() {
      this.$rules = {
          "start" : [
              {
                  token : "comment",
                  regex : "#.*$"
              }, {
                  token : "list.markup",
                  regex : /^(?:-{3}|\.{3})\s*(?=#|$)/     
              },  {
                  token : "list.markup",
                  regex : /^\s*[-?](?:$|\s)/     
              }, {
                  token: "constant",
                  regex: "!![\\w//]+"
              }, {
                  token: "constant.language",
                  regex: "[&\\*][a-zA-Z0-9_-]+"
              }, {
                  token: ["meta.tag", "keyword"],
                  regex: /^(\s*\w.*?)(:(?:\s+|$))/
              },{
                  token: ["meta.tag", "keyword"],
                  regex: /(\w+?)(\s*:(?:\s+|$))/
              }, {
                  token : "keyword.operator",
                  regex : "<<\\w*:\\w*"
              }, {
                  token : "keyword.operator",
                  regex : "-\\s*(?=[{])"
              }, {
                  token : "string", // single line
                  regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
              }, {
                  token : "string", // multi line string start
                  regex : '[|>][-+\\d\\s]*$',
                  next : "qqstring"
              }, {
                  token : "string", // single quoted string
                  regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
              }, {
                  token : "constant.language.boolean",
                  regex : "\\b(?:true|false|TRUE|FALSE|True|False|yes|no)\\b"
              }, {
                  token : "paren.lparen",
                  regex : "[[({]"
              }, {
                  token : "paren.rparen",
                  regex : "[\\])}]"
              }, {
                  token : "constant.numeric", // other number
                  regex : /(?:\s+|^)([+-]?\.inf\b|NaN\b|0x[\dA-Fa-f_]+|0b[10_]+)(?:\s+|$)/,
              }, {
                token : "constant.numeric", // float
                regex : /[\w_\-+.]+/,
                onMatch : function(val, state, stack) {
                  if (val.match(/^[\d][\d_-]*(?:(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?)(?:=[^\w-]|$)$/)) {
                    return "constant.numeric"
                  } else {
                    return "text"
                  }
                }
              }
          ],
          "qqstring" : [
              {
                  token : "string",
                  regex : '(?=(?:(?:\\\\.)|(?:[^:]))*?:)',
                  next : "start"
              }, {
                  token : "string",
                  regex : '.+'
              }
          ],
        };
  
  };
  
  oop.inherits(KubeYamlHighlightRules, TextHighlightRules);
  
  exports.KubeYamlHighlightRules = KubeYamlHighlightRules;
  });
  
  ace.define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"], function(acequire, exports, module) {
  
  var Range = acequire("../range").Range;
  
  var MatchingBraceOutdent = function() {};
  
  (function() {
  
      this.checkOutdent = function(line, input) {
          if (! /^\s+$/.test(line))
              return false;
  
          return /^\s*\}/.test(input);
      };
  
      this.autoOutdent = function(doc, row) {
          var line = doc.getLine(row);
          var match = line.match(/^(\s*\})/);
  
          if (!match) return 0;
  
          var column = match[1].length;
          var openBracePos = doc.findMatchingBracket({row: row, column: column});
  
          if (!openBracePos || openBracePos.row === row) return 0;
  
          var indent = this.$getIndent(doc.getLine(openBracePos.row));
          doc.replace(new Range(row, 0, row, column-1), indent);
      };
  
      this.$getIndent = function(line) {
          return line.match(/^\s*/)[0];
      };
  
  }).call(MatchingBraceOutdent.prototype);
  
  exports.MatchingBraceOutdent = MatchingBraceOutdent;
  });
  
  ace.define("ace/mode/folding/coffee",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode","ace/range"], function(acequire, exports, module) {
  
  var oop = acequire("../../lib/oop");
  var BaseFoldMode = acequire("./fold_mode").FoldMode;
  var Range = acequire("../../range").Range;
  
  var FoldMode = exports.FoldMode = function() {};
  oop.inherits(FoldMode, BaseFoldMode);
  
  (function() {
  
      this.getFoldWidgetRange = function(session, foldStyle, row) {
          var range = this.indentationBlock(session, row);
          if (range)
              return range;
  
          var re = /\S/;
          var line = session.getLine(row);
          var startLevel = line.search(re);
          if (startLevel === -1 || line[startLevel] !== "#")
              return;
  
          var startColumn = line.length;
          var maxRow = session.getLength();
          var startRow = row;
          var endRow = row;
  
          while (++row < maxRow) {
              line = session.getLine(row);
              var level = line.search(re);
  
              if (level === -1)
                  continue;
  
              if (line[level] !== "#")
                  break;
  
              endRow = row;
          }
  
          if (endRow > startRow) {
              var endColumn = session.getLine(endRow).length;
              return new Range(startRow, startColumn, endRow, endColumn);
          }
      };
      this.getFoldWidget = function(session, foldStyle, row) {
          var line = session.getLine(row);
          var indent = line.search(/\S/);
          var next = session.getLine(row + 1);
          var prev = session.getLine(row - 1);
          var prevIndent = prev.search(/\S/);
          var nextIndent = next.search(/\S/);
  
          if (indent === -1) {
              session.foldWidgets[row - 1] = prevIndent !== -1 && prevIndent < nextIndent ? "start" : "";
              return "";
          }
          if (prevIndent === -1) {
              if (indent === nextIndent && line[indent] === "#" && next[indent] === "#") {
                  session.foldWidgets[row - 1] = "";
                  session.foldWidgets[row + 1] = "";
                  return "start";
              }
          } else if (prevIndent === indent && line[indent] === "#" && prev[indent] === "#") {
              if (session.getLine(row - 2).search(/\S/) === -1) {
                  session.foldWidgets[row - 1] = "start";
                  session.foldWidgets[row + 1] = "";
                  return "";
              }
          }
  
          if (prevIndent!== -1 && prevIndent < indent)
              session.foldWidgets[row - 1] = "start";
          else
              session.foldWidgets[row - 1] = "";
  
          if (indent < nextIndent)
              return "start";
          else
              return "";
      };
  
  }).call(FoldMode.prototype);
  
  });
  
  ace.define("ace/mode/kube_yaml",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/kube_yaml_highlight_rules","ace/mode/matching_brace_outdent","ace/mode/folding/coffee"], function(acequire, exports, module) {
  
  var oop = acequire("../lib/oop");
  var TextMode = acequire("./text").Mode;
  var KubeYamlHighlightRules = acequire("./kube_yaml_highlight_rules").KubeYamlHighlightRules;
  var MatchingBraceOutdent = acequire("./matching_brace_outdent").MatchingBraceOutdent;
  var FoldMode = acequire("./folding/coffee").FoldMode;
  
  var Mode = function() {
      this.HighlightRules = KubeYamlHighlightRules;
      this.$outdent = new MatchingBraceOutdent();
      this.foldingRules = new FoldMode();
      this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);
  
  (function() {
  
      this.lineCommentStart = "#";
      
      this.getNextLineIndent = function(state, line, tab) {
          var indent = this.$getIndent(line);
  
          if (state === "start") {
              var match = line.match(/^.*[{([]\s*$/);
              if (match) {
                  indent += tab;
              } else if (line.match(/^\s*-.*$/)) {
                  indent += tab;
              }
          }
  
          return indent;
      };
  
      this.checkOutdent = function(state, line, input) {
          return this.$outdent.checkOutdent(line, input);
      };
  
      this.autoOutdent = function(state, doc, row) {
          this.$outdent.autoOutdent(doc, row);
      };
  
  
      this.$id = "ace/mode/kube_yaml";
  }).call(Mode.prototype);
  
  exports.Mode = Mode;
  
  });
  
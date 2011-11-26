/**
* Module that contains layout algorithms for data structures.
* Depends on core.js, datastructures.js
*/
(function() {
  if (typeof JSAV === "undefined") { return; }
  
  function centerArray(array, $lastItem) {
    // center the array inside its parent container
    if (array.options.hasOwnProperty("center") && !array.options.center) {
      // if options center is set to falsy value, return
      return;
    }
    // width of array expected to be last items position + its width
    var width = $lastItem.position().left + $lastItem.outerWidth(),
      containerWidth = $(array.jsav.container).width();
    array.element.css("left", (containerWidth - width)/2);
  }
  
  function verticalArray(array) {
    var $arr = $(array.element),
      // rely on browser doing the calculation, float everything to the left..
      $items = $arr.find("li").css({"float": "left", "position":"static"}),
      maxHeight = -1,
      indexed = !!array.options.indexed;
    if (indexed) {
      $arr.addClass("jsavindexed");
    }
    $items.each(function(index, item) {
      var $i = $(this),
        pos = $i.position();
      $i.css({"left": pos.left - index, "top": pos.top});
      maxHeight = Math.max(maxHeight, $i.outerHeight());
      if (indexed) {
        var $indexLabel = $i.find(".jsavindexlabel");
        if ($indexLabel.size() === 0) {
          $i.append('<span class="jsavindexlabel">' + index + '</span>');
          $indexLabel = $i.find(".jsavindexlabel");
        }
      }
    });
    // ..and return float and positioning
    $items.css({"float": "none", "position": "absolute"});
    $arr.height(maxHeight + (indexed?30:0));
    centerArray(array, $items.last());
  }
  function barArray(array) {
    var $arr = $(array.element).addClass("jsavbararray"),
      $items = $arr.find("li").css({"position":"relative", "float": "left"}), 
      maxValue = Number.MIN_VALUE,
      indexed = !!array.options.indexed,
      width = $items.first().outerWidth();
      size = array.size();
    if (indexed) {
      $arr.addClass("jsavindexed");
    }
    for (var i = 0; i < size; i++) {
      maxValue = Math.max(maxValue, array.value(i));
    }
    maxValue *= 1.15;
    $items.each(function(index, item) {
      var $i = $(this);
      var $valueBar = $i.find(".jsavvaluebar");
      if ($valueBar.size() === 0) {
        $i.prepend('<span class="jsavvaluebar" />');
        $valueBar = $i.find(".jsavvaluebar");
      }
      $valueBar.css({"height": "100%"});
      $i.find(".jsavvalue").css("height", (100.0*array.value(index) / maxValue) + 15 + "%")
        .html('<span>' + $i.find(".jsavvalue").text() + '</span>');
      if (indexed) {
        var $indexLabel = $i.find(".jsavindexlabel");
        if ($indexLabel.size() === 0) {
          $i.append('<span class="jsavindexlabel">' + index + '</span>');
          $indexLabel = $i.find(".jsavindexlabel");
        }
      }
    });
    centerArray(array, $items.last());
  }
  
  function treeLayout(tree) {
	  var NODEGAP = 50;
    var results = {};
    var calculateLayout = function(node) {
  		var ch = node.children();
  		for (var i = 0; i < ch.length; i++) {
  			if (ch[i]) {
  				calculateLayout(ch[i]);
  			} else {
  				//debug("child is null!!");
  			}
  		}
  		results[node.id()] = {
  		  cachedTranslation: {width: 0, height: 0},
  		  translation: {width: 0, height: 0},
  		  node: node
  		};
      calculateContours(node);
  	},
  	calculateContours = function(node) {
  		var vtcSize = {width: 40, height: 40};
          var children = node.children();
          var rootLeft = -vtcSize.width / 2;
  		var rootRight = vtcSize.width / 2 + (vtcSize.width % 2 === 0 ? 0 : 1);
  		var rootHeight = vtcSize.height;
  		if (children.length === 0) {
  			results[node.id()].contours = new TreeContours(rootLeft, rootRight, rootHeight, node.value());
  			translateThisNode(node, -rootLeft, 0);
  		} else {
  			var transSum = 0;
  			var firstChild = children[0];
  			results[node.id()].contours = results[firstChild.id()].contours;
  			results[firstChild.id()].contours = null;
  			translateNodes(firstChild, 0, NODEGAP + rootHeight);

  			for (var i = 1; i < children.length; i++) {
  				var child = children[i];
  				var childC = results[child.id()].contours;
  				var trans = results[node.id()].contours.calcTranslation(childC, NODEGAP);
  				transSum += trans;

  				results[child.id()].contours = null;
  				results[node.id()].contours.joinWith(childC, trans);

  				translateNodes(child, getXTranslation(firstChild) + trans - getXTranslation(child),
                                  	NODEGAP + rootHeight);
  			}

  			var rootTrans = transSum / children.length;
  			results[node.id()].contours.addOnTop(rootLeft, rootRight, rootHeight, NODEGAP, rootTrans);
  			translateThisNode(node, getXTranslation(firstChild) + rootTrans, 0);
  		}
  	},
  	translateThisNode = function(node, x, y) {
  		results[node.id()].translation.width += x;
  		results[node.id()].translation.height += y;
  	},
  	translateAllNodes = function(node, howMuch) {
  		if (!results[node.id()].cachedTranslation) {
  			results[node.id()].cachedTranslation = {width: 0, height: 0};
  		}
  		results[node.id()].cachedTranslation.width += howMuch.width;
  		results[node.id()].cachedTranslation.height += howMuch.height;
  	},
  	translateNodes = function(node, x, y) {
  		translateAllNodes(node, {width: x, height: y});
  	},
  	getXTranslation = function(node) {
  		return results[node.id()].translation.width +
  			((!results[node.id()].cachedTranslation) ? 0 : results[node.id()].cachedTranslation.width);
  	},
  	propagateTranslations = function(node) {
  	  var noderes = results[node.id()];
  		if (noderes.cachedTranslation) {
  			var ch = node.children();
  			for (var i = 0; i < ch.length; i++) {
  				var child = ch[i];
  				translateAllNodes(child, noderes.cachedTranslation);
  				propagateTranslations(child);
  			}
  			noderes.translation.width += noderes.cachedTranslation.width;
  			noderes.translation.height += noderes.cachedTranslation.height;
  			noderes.cachedTranslation = null;
  		}
  	},
  	calculateFinalLayout = function(node, dx, dy) {
  	        if (-results[node.id()].contours.cLeftExtent - getXTranslation(node) > 0) {
  			translate(node, -results[node.id()].contours.cLeftExtent - this.getXTranslation(node), 0);
  		}
  		translateNodes(node, dx, dy);
  		propagateTranslations(node);
  	};
  	
  	calculateLayout(tree.root());
  	calculateFinalLayout(tree.root(), 20, 10+NODEGAP);
  	$.each(results, function(key, value) {
  	  var oldPos = value.node.element.position();
  	  if (oldPos.left == 0 && oldPos.top == 0) {
    	  value.node.element.css({left: value.translation.width + "px", top: value.translation.height + "px"});
  	  } else {
    	  value.node.css({left: value.translation.width + "px", top: value.translation.height + "px"});
  	  }
  	});
  	var offset = tree.element.position();
  	$.each(results, function(key, value) {
  	  var node = value.node;
  	  if (node['edgetoparent']) {
  	    var start = {left: value.translation.width + offset.left,
  	                 top: value.translation.height + offset.top},
  	        endnode = results[node.parent().id()].translation,
  	        end = {left: endnode.width + offset.left,
  	               top: endnode.height + offset.top};
  	        
  	    edgeLayout(node.edgetoparent, start, end);
  	  }
  	});
  }
  
  var edgeLayout = function(edge, start, end) {
    var NODESIZE = edge.startnode.element.outerWidth()/2.0,
      svgstyle = edge.jsav.getSvg().canvas.style;
    var startpos = edge.startnode.element.offset(),
        endpos = edge.endnode.element.offset(),
        fromX =  Math.round(start.left + NODESIZE - parseInt(svgstyle.left, 10)),
  	    fromY = Math.round(start.top + NODESIZE - parseInt(svgstyle.top, 10)),
  	    toX = Math.round(end.left + NODESIZE - parseInt(svgstyle.left, 10)),
  	    toY = Math.round(end.top + NODESIZE - parseInt(svgstyle.top, 10)),
  	    fromAngle = normalizeAngle(2*Math.PI - Math.atan2(toY - fromY, toX - fromX)),
        toAngle = normalizeAngle(2*Math.PI - Math.atan2(fromY - toY, fromX - toX)),
        fromPoint = getNodeBorderAtAngle(0, edge.startnode.element, 
                  {width: NODESIZE, height: NODESIZE, x: fromX, y: fromY}, fromAngle),
        toPoint = getNodeBorderAtAngle(1, edge.endnode.element, 
                  {width: NODESIZE, height: NODESIZE, x: toX, y: toY}, toAngle)
    edge.g.movePoints([fromPoint, toPoint]);

    function normalizeAngle(angle) {
    	while (angle < 0)
        angle += 2 * Math.PI;
      while (angle >= 2 * Math.PI) 
        angle -= 2 * Math.PI;
      return angle;
    };
    function getNodeBorderAtAngle(pos, node, dim, angle) {
      // dim: x, y coords of center and half of width and height
    	var x, y,
          urCornerA = Math.atan2(dim.height*2.0, dim.width*2.0),
          ulCornerA = Math.PI - urCornerA,
          lrCornerA = 2*Math.PI - urCornerA,
          llCornerA = urCornerA + Math.PI;

      if (angle < urCornerA || angle > lrCornerA) { // on right side
        x = dim.x + dim.width;
        y = dim.y - (dim.width) * Math.tan(angle);
      } else if (angle > ulCornerA && angle < llCornerA) { // left
        x = dim.x - dim.width;
        y = dim.y + (dim.width) * Math.tan(angle - Math.PI);
      } else if (angle <= ulCornerA) { // top
        x = dim.x + (dim.height) / Math.tan(angle);
        y = dim.y- dim.height;
      } else { // on bottom side
        x = dim.x - (dim.height) / Math.tan(angle - Math.PI);
        y = dim.y + dim.height;
      }
    	return [pos, Math.round(x), Math.round(y)];
    }
  }
  
  var layouts = {};
  layouts.array = {
    "_default": verticalArray,
    "bar": barArray,
    "array": verticalArray
  };
  layouts.tree = {
    "_default": treeLayout
  };
  layouts.edge = {
    "_default": edgeLayout
  };
  JSAV.ext.layout = layouts;
})();

TreeContours = function(left, right, height, data) {
		this.cHeight = height;
		this.leftCDims = [];
		this.leftCDims[this.leftCDims.length] = {width: -left, height: height};
		this.cLeftExtent = left;
		this.rightCDims = [];
		this.rightCDims[this.rightCDims.length] = {width: -right, height: height};
		this.cRightExtent = right;
	};
TreeContours.prototype = {
	getHeight: function() {
		return this.cHeight;
	},
	getWidth: function() {
		return this.cRightExtent - this.cLeftExtent;
	},
	addOnTop: function(left, right, height, addHeight, originTrans) {
	  var lCD = this.leftCDims,
	      rCD = this.rightCDims;
		lCD[lCD.length-1].height += addHeight;
		lCD[lCD.length-1].width += originTrans + left;
		rCD[rCD.length-1].height += addHeight;
		rCD[rCD.length-1].width += originTrans + right;

		lCD.push({width: -left, height: height});
		rCD.push({width: -right, height: height});
		this.cHeight += height + addHeight;
		this.cLeftExtent -= originTrans;
		this.cRightExtent -= originTrans;
		if (left < this.cLeftExtent) {
			this.cLeftExtent = left;
		}
		if (right > this.cRightExtent) {
			this.cRightExtent = right;
		}
	},
	joinWith: function(other, hDist) {
		if (other.cHeight > this.cHeight) {
			var newLeftC = new Array();
			var otherLeft = other.cHeight - this.cHeight;
			var thisCDisp = 0;
			var otherCDisp = 0;
			$.each(other.leftCDims, function (index, item) {
				if (otherLeft > 0 ) {
					var dim = {width: item.width, height: item.height};
					otherLeft -= item.height;
					if (otherLeft < 0) {
						dim.height += otherLeft;					
					}
					newLeftC[newLeftC.length] = dim;
				} else {
					otherCDisp += item.width;
				}
			});
			var middle = newLeftC[newLeftC.length - 1];

			$.each(this.leftCDims, function(index, item) {
				thisCDisp += item.width;
				newLeftC[newLeftC.length] = {width: item.width, height: item.height};
			});
               
			middle.width -= thisCDisp - otherCDisp;
			middle.width -= hDist;
			this.leftCDims = newLeftC;
		}
		if (other.cHeight >= this.cHeight) {
			this.rightCDims = other.rightCDims.slice();
		} else {
			var thisLeft = this.cHeight - other.cHeight;
			var nextIndex = 0;

			var thisCDisp = 0;
			var otherCDisp = 0;
			$.each(this.rightCDims, function (index, item) {
				if (thisLeft > 0 ) {
					nextIndex++;
					thisLeft -= item.height;
					if (thisLeft < 0) {
						item.height += thisLeft;
					}
				} else {
					thisCDisp += item.width;
				}
			});
			for (var i = nextIndex+1;i< this.rightCDims.length;i++) {
				this.rightCDims[i] = null;
			}
			this.rightCDims = this.rightCDims.compact();
			var middle = this.rightCDims[nextIndex];

			for (i = 0; i < other.rightCDims.length; i++) {
				var item = other.rightCDims[i];
				otherCDisp += item.width;
				this.rightCDims[this.rightCDims.length] = {width: item.width, height: item.height};
			}
			middle.width += thisCDisp - otherCDisp;
			middle.width += hDist;
		}
		this.rightCDims[this.rightCDims.length-1].width -= hDist;

		if (other.cHeight > this.cHeight) {
			this.cHeight = other.cHeight;
		}
		if (other.cLeftExtent + hDist < this.cLeftExtent) {
			this.cLeftExtent = other.cLeftExtent + hDist;
		}
		if (other.cRightExtent + hDist > this.cRightExtent) {
			this.cRightExtent = other.cRightExtent + hDist;
		}
	},
	calcTranslation: function(other, wantedDist) {
		var lc = this.rightCDims,
		    rc = other.leftCDims,
		    li = lc.length - 1,
		    ri = rc.length - 1,
        lCumD = {width: 0, height: 0},
		    rCumD = {width: 0, height: 0},
		    displacement = wantedDist;

		while (true) {
			if (li < 0) {
				if (ri < 0 || rCumD.height >= lCumD.height) {
					break;
				}
				var rd = rc[ri];
				rCumD.height += rd.height;
				rCumD.width += rd.width;
				ri--;
			} else if (ri < 0) {
				if (lCumD.height >= rCumD.height) {
					break;
				}
				var ld = lc[li];
				lCumD.height += ld.height;
				lCumD.width += ld.width;
				li--;
			} else {
				var ld = lc[li];
				var rd = rc[ri];
				var leftNewHeight = lCumD.height;
				var rightNewHeight = rCumD.height;
				if (leftNewHeight <= rightNewHeight) {
					lCumD.height += ld.height;
					lCumD.width += ld.width;
					li--;
				}
				if (rightNewHeight <= leftNewHeight) {
					rCumD.height += rd.height;
					rCumD.width += rd.width;
					ri--;
				}
			}
			if (displacement < rCumD.width - lCumD.width + wantedDist) {
				displacement = rCumD.width - lCumD.width + wantedDist;
			}
		}
		return displacement;
	}
};
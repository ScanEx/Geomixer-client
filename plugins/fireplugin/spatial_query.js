(function(){

/*
 Spatial Query - a JQuery like Javascript library for handling spatial maths
 Copyright (c) 2009 Chris Zelenak
 Spatial Query is freely distributable under the MIT X11 License - see LICENSE file.

 Chris Z
 For work at www.indy.com
 Talked about at www.yeti-factory.org

*/
var _polygon = function(o) {
  return new _polygon.prototype.assert(o);
}
var _vector = function(o) {
  return new _vector.prototype.assert(o);
}
var _EF = function(o) {
  return new _EF.prototype.assert(o);
}

var $p = _polygon;
var $v = _vector;

window.SpatialQuery = {
    $p: $p, 
    $v: $v
}


// Lookup tables for boolean operations (intersection, union, difference)
var polygonsorientation = Array();
var fragmenttype = Array();
var boundaryfragment = Array();
var resultsorientation = Array();



_EF.prototype = {
  assert : function() {
    this.edge_list = [];
	return this;
  },
  insertE : function(fragment, reg) {
    // Check if the edge is already in the list
	for(var i = 0;i < this.edge_list.length;i++) {
	  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
	    // If the edge is already in the list, we are done.
		return;
	  
	  }
	  
	  if(this.edge_list[i][0][0] == fragment[1][0] && this.edge_list[i][0][1] == fragment[1][1] && this.edge_list[i][1][0] == fragment[0][0] && this.edge_list[i][1][1] == fragment[0][1]) {
		// If the edge is found in the list, but reversed, remove it from the list and we are done.
		this.edge_list.splice(i,1);
		return;		 
	  }
    }
    this.edge_list.push(fragment);
  },
  deleteE : function(fragment) {
    // Check if the edge is already in the list
	for(var i = 0;i < this.edge_list.length;i++) {
	  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
	    // If the edge is already in the list, delete it
		this.edge_list.splice(i,1);
		return;
	  }
    }
	// Otherwise there is nothing to remove.
	//console.log("deleteE: no edge to delete.");
	return;
  },
  popnextE : function(point) {
	// Check if the edge is already in the list
	for(var i = 0;i < this.edge_list.length;i++) {
		if(this.edge_list[i][0][0] == point[0] && this.edge_list[i][0][1] == point[1]){
			var result =  this.edge_list[i];
			this.edge_list.splice(i,1);			
			return result;		  
		}
	}
	return null;
  },
  searchE : function(fragment) {
    // Check if the edge is already in the list
	for(var i = 0;i < this.edge_list.length;i++) {
	  if((this.edge_list[i][0][0] == fragment[0][0] && this.edge_list[i][0][1] == fragment[0][1] && this.edge_list[i][1][0] == fragment[1][0] && this.edge_list[i][1][1] == fragment[1][1])){
	    // If the edge in the list, return it's index.
		return i;
	  }
    }
	
	//console.log("searchE: no edge found.");
	return -1;
  },
  organizeE : function() {
    return;
  }
}

_vector.prototype = {
  assert: function(obj,attribs) {
    this.data = [0, 0, 0];
	if(obj == undefined || obj == null){
	  this.dims = 0;
	  this.data = [];
	}else if(obj.vector && typeof(obj.vector) == "function") {
	  var v = obj.vector();
	  this.data = v.data;
	  this.dims = v.dims;
	}else if(obj.x || obj.y || obj.z){
	  this.data[0] = obj.x || 0.0;
	  this.data[1] = obj.y || 0.0;
	  this.data[2] = obj.z || 0.0;
	} else if(obj.length) {
	  this.data = obj;
	  this.dims = obj.length;
	}
	
	if(attribs != null && attribs != undefined){
	  for(var k in attribs) {
	    this[k] = attribs[k];
	  }
	}
	return this;	
  },
  
  x : function(){
    return this.data[0];
  },
  y : function(){
    return this.data[1];
  },
  z : function(){
    return this.data[2];
  },
  vector : function() {
    return this;
  }
}

function init_union_tables() 
{
	if(polygonsorientation.length > 0){
		return;
	}
	polygonsorientation = [[[ORIENTATION_SAME,ORIENTATION_SAME,ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE],
							[ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE,ORIENTATION_SAME,ORIENTATION_SAME]],
						   [[ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE,ORIENTATION_SAME,ORIENTATION_SAME],
						    [ORIENTATION_SAME,ORIENTATION_SAME,ORIENTATION_OPPOSITE,ORIENTATION_OPPOSITE]]
						  ];

	fragmenttype = [
					[
					 [[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE]],
					 [[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE]]
					],
					[
					 [[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE]],
					 [[T_VERTEX_OUTSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_INSIDE,T_VERTEX_INSIDE],[T_VERTEX_INSIDE,T_VERTEX_OUTSIDE],[T_VERTEX_OUTSIDE,T_VERTEX_INSIDE]]
					]
					];
	
	boundaryfragment = [
	                    [
						  [[[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE]],
						  [[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE]],
						  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_BOTH,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]]],
						
						 [[[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_NONE]],
						  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_BOTH]]]
						],
						[
						 [[[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_BOTH]],
						  [[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_BOTH]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH]],
						  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_BOTH]]],
						
						 [[[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_FORWARD],				[DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_FORWARD]],
						  [[DIRECTION_FORWARD,DIRECTION_NONE,DIRECTION_FORWARD,DIRECTION_NONE],				[DIRECTION_FORWARD,DIRECTION_BOTH,DIRECTION_FORWARD,DIRECTION_NONE]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],      				[DIRECTION_NONE,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]],
						  [[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD],		[DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD,DIRECTION_FORWARD]],
						  [[DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE,DIRECTION_NONE],					[DIRECTION_BOTH,DIRECTION_BOTH,DIRECTION_NONE,DIRECTION_NONE]]]
						]
					  ];
	
	resultsorientation = [[[1,1,1,-1],
	                       [1,-1,1,1]],
						  [[-1,1,1,1],
						   [1,1,-1,1]]
						 ];
}

_polygon.prototype = {  
  assert: function(obj,type) {
    init_union_tables();
	this.bound_minX = Number.MAX_VALUE;
	this.bound_maxX = -Number.MAX_VALUE;
	this.bound_minY = Number.MAX_VALUE;
	this.bound_maxY = -Number.MAX_VALUE;
	
    if(obj == undefined || obj == null){
	   this.head = null;
	   this.tail = null;
	   this.direciton = null;
	   this.holes = [];
	   if(type == null || type == undefined) {
		this.type = _polygon.TYPE_ISLAND;
	   }else{
	    this.type = type;
	   }
	   this.count = 0;
	} else if (obj.polygon && typeof(obj.polygon) == "function") {
	  var p = obj.polygon();
	  this.head = p.head;
	  this.tail = p.tail;
	  this.direction = p.direction;
	  this.count = p.count;
	  this.type = p.type;
	  this.holes = p.holes;
	} else if(obj.length) {
	  this.count = 0;
	  this.holes = [];
	  for(var i = 0;i < obj.length; i++) {
	    this.add_point(obj[i],{type: T_VERTEX_BOUNDARY});
	  }
	  this.direction = this.compute_direction();
	  if(type == null || type == undefined) {
		this.type = _polygon.TYPE_ISLAND;
	   }else{
	    this.type = type;
	   }
	}
	return this;
  },
  compute_direction : function(){
    if(this.count < 3) {
	  return _polygon.DIRECTION_INVALID;
	}
	var minXNode = this.head;
	this.foreach(function(node) {
	  if ( node.x < minXNode.x) {
	    minXNode = node;
	  }
	});
	if (minXNode.next.y > minXNode.prev.y) {
	  return _polygon.DIRECTION_CLOCKWISE;
	} else {
	  return _polygon.DIRECTION_COUNTERCLOCKWISE;
	}
  },
  reverse_direction : function(){
    var start = this.head;
	var current = this.head;
	var tmp = null;
	
	do{
		tmp = current.next;
		current.next = current.prev;
		current.prev = tmp;
		// 
		current = current.prev; 
	}while(current != start);
	
	this.direction = this.compute_direction();
  },
  union: function(otherPoly) {  
	try{
		return _polygon.prototype.boolean_operation(this, otherPoly, OPERATION_UNION,0);
	}catch(e){
		console.log(e);
	}
  },
  boolean_operation: function(A,B,Oper,Reg) {
	var orientationA = A.direction;
	var orientationB = B.direction;
	
	// If the operation is union, and bounding boxes dont overlap return right away.
	if(A.bound_maxX < B.bound_minX || A.bound_minX > B.bound_maxX || 
	   A.bound_maxY < B.bound_minY || A.bound_minY > B.bound_maxY) {
		return null;
	}
	
	// Initialize Edge fragment structure.
	
	edgeFragments = _EF();
	//(function(){
	// Change polygon orientation according to operation table.
	if(polygonsorientation[A.type][B.type][Oper] == ORIENTATION_SAME && orientationA != orientationB){
		if(orientationA != orientationB){
			B.reverse_direction();
		}
	}else if(polygonsorientation[A.type][B.type][Oper] == ORIENTATION_OPPOSITE && orientationA == orientationB){
		B.reverse_direction();
	}
	
	var nInside = 0;
	
	// Classify which vertices are inside the other polygon.
	var node = A.head;
	do { 
		node.type = B.point_inside_2d(node);
		if(node.type != T_VERTEX_OUTSIDE) {
			nInside++;
		}
		node = node.next;
	} while(node != A.head);

	var node = B.head;
	do {
		node.type = A.point_inside_2d(node);
		if(node.type != T_VERTEX_OUTSIDE) {
			nInside++;
		}
		node = node.next;
	} while(node != B.head);
	
	// If there are no inside or boundary nodes, there is nothing to do, two polygons dont overlap.
	if(nInside == 0 && Oper == OPERATION_UNION) {
		return null;
	}
	
	// Find intersections
	var noIntersections = 1;
	var node = A.head;
	do {
		var a_start = node;
		var a_end = node.next;		
		
		var node2 = B.head;
		do {
			var b_start = node2;
			var b_end = node2.next;
			
			var seg1 = [[a_start.x,a_start.y],[a_end.x,a_end.y]];
			var seg2 = [[b_start.x,b_start.y],[b_end.x,b_end.y]];
			var intersection = pointOfIntersectionForLineSegments(seg1,seg2);
			
			if(intersection != null) {
			  // Only insert intersection if its not already a vertex.
			  // Otherwise just change the vertex type.
			  if(intersection[2] == 0){
				a_start.type = T_VERTEX_BOUNDARY;
			  }else if(intersection[2] == 1){
				a_end.type = T_VERTEX_BOUNDARY;
			  }else{
				var Point = new _polygon.prototype.vtx(intersection,{type: T_VERTEX_BOUNDARY});
				A.insert_vertex_after(Point,a_start);
				a_end = node.next;				
			  }
			  
			  if(intersection[3] == 0){
				b_start.type = T_VERTEX_BOUNDARY;
			  }else if(intersection[3] == 1){
				b_end.type = T_VERTEX_BOUNDARY;
			  }else{
				var Point = new _polygon.prototype.vtx(intersection,{type: T_VERTEX_BOUNDARY});
				B.insert_vertex_after(Point,b_start);
				b_end = node2.next;
			  }
			}
			node2 = node2.next;
		} while(node2 != B.head)
		
		node = node.next;
	} while(node != A.head);
	//})();
	
	//(function(){
	// Classify, select and organize edge fragments
	var Type = fragmenttype[A.type][B.type][Oper][0];	
	
	var node = A.head;
	do { 
		var start = node;
		var end = node.next;		
		var seg = [[start.x,start.y],[end.x,end.y]];
		
		if(start.type == Type || end.type == Type) {			
			edgeFragments.insertE(seg);
		} else if (start.type == T_VERTEX_BOUNDARY && end.type == T_VERTEX_BOUNDARY) {
			var m = [ (end.x + start.x)/2, (end.y + start.y)/2 ];
			var res = B.point_inside_2d(m);
			
			if(res == Type || res == T_VERTEX_BOUNDARY){
				edgeFragments.insertE(seg);
			}
		}
		node = node.next;
	} while(node != A.head);
	
	var Type2 = fragmenttype[A.type][B.type][Oper][1];
	
	var node = B.head;
	do { 
		var start = node;
		var end = node.next;		
		var seg = [[start.x,start.y],[end.x,end.y]];
		
		if(start.type == Type2 || end.type == Type2) {			
			edgeFragments.insertE(seg);
		} else if (start.type == T_VERTEX_BOUNDARY && end.type == T_VERTEX_BOUNDARY) {
			var m = [ (end.x + start.x)/2, (end.y + start.y)/2 ];
			var res = A.point_inside_2d(m);
			
			if(res == Type2 || res == T_VERTEX_BOUNDARY){
				edgeFragments.insertE(seg);
			}
		}
		node = node.next;
	} while(node != B.head);
	
	/*
	for(iEdge = 0;iEdge < edgeFragments.edge_list.length;iEdge++) {
		seg = edgeFragments.edge_list[iEdge];
		revEdge = [seg[1],seg[0]];
		var iRevEdge = edgeFragments.searchE(revEdge);
		
		// TODO: Compute situation code
		var sit = 0;
		
		d = boundaryfragment[A.type][B.type][sit][Reg][Oper];
		
		if(d == DIRECTION_NONE) {
			edgeFragments.deleteE(seg);
			if(iRevEdge >= 0) {
				edgeFragments.deleteE(revEdge);
			}
			// TODO Verify this code is correct
		} else if(d == DIRECTION_BOTH){
			edgeFragments.delteE(seg);	
			// TOdo investigate what to do here exactly, not quiet clear
		}
	}
	*/
	
	edgeFragments.organizeE();
	//})();
	var Out = null;
	var outHoles = [];
	var outPolygons = [];
	
	
	//(function constructResultPolygons(){
	// Construct the result polygons and find their types.
	while(edgeFragments.edge_list.length > 0) {
		var fNext = edgeFragments.popnextE(edgeFragments.edge_list[0][0]);
		
		var edgeLoop = [];
		
		do {
			edgeLoop.push(fNext);
			fNext = edgeFragments.popnextE(fNext[1]);
		}while(fNext != null);
					
		var cEdge = edgeLoop[0];		
		
		var resultPolygon = $p();
		var startPoint = cEdge[0];
		
		for(var iLoopEdge = 1;iLoopEdge <= edgeLoop.length;iLoopEdge++) {
			var seg1 = cEdge;
			
			if(iLoopEdge == edgeLoop.length) {			
				// Add the first point of the edge loop into the result polygon.
				seg2 = [startPoint,[resultPolygon.head.x,resultPolygon.head.y]];
			} else {
				seg2 = edgeLoop[iLoopEdge];
			}
			
			var dy1 = (seg1[1][1] - seg1[0][1]);
			var dy2 = (seg2[1][1] - seg2[0][1]);
			
			var slope1 = Number.MAX_VALUE; // Default to Number.MAX_VALUE, when dividing by 0	
			var slope2 = Number.MAX_VALUE;
			
			if(dy1 != 0){
				slope1 = (seg1[1][0] - seg1[0][0]) / dy1;
			}
			if(dy2 != 0){
				slope2 = (seg2[1][0] - seg2[0][0]) / dy2;
			}
			
			// Check if the two edges are colinear, if they are join them
			if(slope1 == slope2){
				cEdge = [seg1[0],seg2[1]];
			}else{
				// Otherwise record the edge in to the output structure
				resultPolygon.add_point(cEdge[1]);
				cEdge = seg2;
			}
		}
		
		// Figure out the orientation of the current result polygon
		resultPolygon.direction = resultPolygon.compute_direction();
		if(resultPolygon.direction == orientationA) {
			if(resultsorientation [A.type][B.type][Oper] == ORIENTATION_SAME){
				resultPolygon.type = (Number)(A.type);
			} else {
				resultPolygon.type = (Number)(!A.type);
			}
		} else if(resultsorientation [A.type][B.type][Oper] == ORIENTATION_SAME) {
			resultPolygon.type = (Number)(!A.type);
		} else {
			resultPolygon.type = (Number)(A.type);
		}
		
		if(resultPolygon.type == _polygon.TYPE_ISLAND) {
			outPolygons.push(resultPolygon);
		} else {
			outHoles.push(resultPolygon);
		}
	}
	//})();
	
	if(outPolygons.length == 1){
		Out = outPolygons[0];
		Out.holes = outHoles;
	}else{
		console.log('Output polygons invalid. Length = '+outPolygons.length);
	}
	
	return Out;	
  },
  vtx : function(pt, attribs) {
    this.x = (pt[0]) || 0.0;
	this.y = (pt[1]) || 0.0;
	this.next = null;
	this.prev = null;
	
	if(attribs != null && attribs != undefined){
	  for(var k in attribs) {
	    this[k] = attribs[k];
	  }
	}
	return this;  
  },
  add_point : function(point, attribs) {
    var v = new _polygon.prototype.vtx(point, attribs);
	this.add_vtx(v);
	return this;
  },
  foreach : function(fn){
    var node = this.head;
	do { 
	  fn.apply(this, [node]);
	  node = node.next;
	} while(node != this.head);
  },
  add_vtx : function(vtx) {
	// Update polygon bounding box.
	if(vtx.x < this.bound_minX){
		this.bound_minX = vtx.x;
	}
	if(vtx.x > this.bound_maxX){
		this.bound_maxX = vtx.x;
	}
	if(vtx.y < this.bound_minY){
		this.bound_minY = vtx.y;
	}
	if(vtx.y > this.bound_maxY){
		this.bound_maxY = vtx.y;
	}
	
    if(this.head == null) {
	  this.head = vtx;
	  this.tail = vtx;
	  this.head.prev = this.head;
	  this.head.next = this.head;
	  this.count++;
	} else {
	  this.insert_vertex_after(vtx, this.tail);
	}
	return this;  
  },
  insert_vertex_after : function(vtx, after) {
    var nxt = after.next;
	after.next = vtx;
	nxt.prev = vtx;
	vtx.prev = after;
	vtx.next = nxt;
	if(this.tail == after) {
	  this.tail = vtx;
	}
	this.count++;
	return this;
  }, 
   to_wkt : function(){
	
    var a = [];
    this.foreach(function(node){
                   a.push([node.x, node.y]);
                 });
				 
	var str = "POLYGON(";
	
	str += "(";
	for(var i = 0; i < a.length;i++) {
		str += a[i][0] + " " + a[i][1] + ",";
	}
	str += a[0][0] + " " + a[0][1];
	str += ")";
	
	for(var iHole = 0;iHole < this.holes.length;iHole++) {
		var b = [];
		this.holes[iHole].foreach(function(node){
			   b.push([node.x, node.y]);
			 });
		str += ",(";
		for(var i = 0; i < b.length;i++) {
			str += b[i][0] + " " + b[i][1] + ",";
		}
		str += b[0][0] + " " + b[0][1];
		str += ")";	
	}
	
	str +=")";
	
    return str;
  },
  to_point_array_2d : function(){
    var a = [];
    this.foreach(function(node){
                   a.push([node.x, node.y]);
                 });
    return a;
  }, 
  point_inside_2d : function(vtx) {
    var wn = 0;    // the winding number counter
	
	var isBoundary = 0;
	
	var v_x = 0;
	var v_y = 0;
	
	if(vtx.x){
	  v_x = vtx.x;
	  v_y = vtx.y;
	} else{
	  v_x = vtx[0];
	  v_y = vtx[1];
	}
	
	var seg = [[v_x, v_y],[10000000,v_y]];
	
    // loop through all edges of the polygon
	var node = this.head;
	do {
	    var nxt = node.next;
		var seg2 = [[node.x,node.y],[nxt.x,nxt.y]];
		
		var intersection = pointOfIntersectionForLineSegments(seg,seg2);
		
		if(intersection != null) {
			if(intersection[2] == 0) {
			isBoundary = 1;
		  }
			// E[i] crosses upward ala Rule #1
			if(seg2[0][1] < seg2[1][1]) {
			  // For upwards edge ignore ending point
			  if(intersection[3] != 1){
				wn++;			  
			  }
			}else if(seg2[0][1] > seg2[1][1]) {
				// For downward edge ignore starting point
				if(intersection[3] != 0){
				wn--;
			}
		  }
		}else if(seg2[0][1] == v_y && seg2[0][1] == seg2[1][1] && (seg2[0][0] <= v_x || seg2[1][0] <= v_x)){
			// Check if the point is on the boundary (between two x coordinates of the edge segment)
			if( (v_x >= seg2[0][0] && v_x <= seg2[1][0]) || (v_x >= seg2[1][0] && v_x <= seg2[0][0])){
				isBoundary = 1;
			}
		}
		
		node = nxt;
	} while(node != this.head);
	
	// Handle case if the point is on the boundary of the polygon
	if(isBoundary) { 
		return T_VERTEX_BOUNDARY;
	}else{
		// Flip output for "hole" polygons.
		if((wn == 0 && this.type == 0) || (wn != 0 && this.type == 1)) {
			return T_VERTEX_OUTSIDE;
		}else{
			return T_VERTEX_INSIDE;
		}
	}
  }
}

_vector.numberInRange = function(n, min, max){
  return (n >= min && n <= max);
};
/*
_vector.pointAndTypeOfIntersectionForLineSegments = function{
	var intersection = pointOfIntersectionForLineSegments(seg_a, seg_b);
	
	if(intersection == null){
		return T_VERTEX_OUTSIDE;
	} else {
		var point = [intersection[0],intersection[1]];
		
		if(intersection[3] == 0 || intersection[3] == 1 || intersection[3] == 0 || intersection[3] == 1) {
			return T_VERTEX_INSIDE;
		} else {
			return T_VERTEX_BOUNDARY;
		}
	}
}
*/
// segment: [ [x,y], [x2, y2] ]
// algo and original code from:
// http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
function pointOfIntersectionForLineSegments(seg_a, seg_b)
{	  
  // Assume lines are horizontal or vertical;
  
  // If segment a is vertical
  if(seg_a[0][0] == seg_a[1][0]) {
  
	// If both vertical, return null
	if(seg_b[0][0] == seg_b[1][0]) {
		return null;
	} else {
		// Make sure the segments intersect.
		if((seg_b[0][1] > seg_a[0][1] && seg_b[0][1] > seg_a[1][1]) || (seg_b[0][1] < seg_a[0][1] && seg_b[0][1] < seg_a[1][1]) ||
		   (seg_a[0][0] > seg_b[0][0] && seg_a[0][0] > seg_b[1][0]) || (seg_a[0][0] < seg_b[0][0] && seg_a[0][0] < seg_b[1][0])){	
			return null;
		}else{			
			// Ua should be 0 if first point is on the line, 1 if last point is on the line, and 0.5 otherwise
			ua = (seg_a[0][1] == seg_b[0][1])? 0 : ((seg_a[1][1] == seg_b[0][1])? 1 : 0.5);
			ub = (seg_b[0][0] == seg_a[0][0])? 0 : ((seg_b[1][0] == seg_a[0][0])? 1 : 0.5);
			
			return [
			  seg_a[0][0],
			  seg_b[0][1],
			  ua,
			  ub
			];
		}
	}
  } else {
	// If both horizontal, return null
	if(seg_b[0][1] == seg_b[1][1]) {
		return null;
	} else {
		// Make sure the segments intersect.
		if((seg_b[0][0] > seg_a[0][0] && seg_b[0][0] > seg_a[1][0]) || (seg_b[0][0] < seg_a[0][0] && seg_b[0][0] < seg_a[1][0]) ||
		   (seg_a[0][1] > seg_b[0][1] && seg_a[0][1] > seg_b[1][1]) || (seg_a[0][1] < seg_b[0][1] && seg_a[0][1] < seg_b[1][1])){
			return null;
		} else {		
			// Ua should be 0 if first point is on the line, 1 if last point is on the line, and 0.5 otherwise
			ua = (seg_a[0][0] == seg_b[0][0])? 0 : ((seg_a[1][0] == seg_b[0][0])? 1 : 0.5);
			ub = (seg_b[0][1] == seg_a[0][1])? 0 : ((seg_b[1][1] == seg_a[0][1])? 1 : 0.5);
			
			return [
			  seg_b[0][0],
			  seg_a[0][1],
			  ua,
			  ub
			];
		}
	}
  }
  return result;
};
_vector.pointOfIntersectionForLineSegmentsDiag = function(seg_a, seg_b){
  var start_a = seg_a[0],  // v1
      end_a = seg_a[1],  // v2
      start_b = seg_b[0], // v3
      end_b = seg_b[1]; // v4
	  
  var denom = (end_b[1] - start_b[1]) * (end_a[0] - start_a[0]) - (end_b[0] - start_b[0]) * (end_a[1] - start_a[1]);
  if(denom == 0) return null; // parallel
  var numer_a = (end_b[0] - start_b[0]) * (start_a[1] - start_b[1]) - (end_b[1] - start_b[1]) * (start_a[0] - start_b[0]);
  var numer_b = (end_a[0] - start_a[0]) * (start_a[1] - start_b[1]) - (end_a[1] - start_a[1]) * (start_a[0] - start_b[0]);
  if(numer_a == 0 && denom == 0 && numer_a == numer_b) return null; // coincident
  var ua = numer_a / denom,
      ub = numer_b / denom;
  if(_vector.numberInRange(ua, 0.0, 1.0) && _vector.numberInRange(ub, 0.0, 1.0)){
    return [
      start_a[0] + ua * (end_a[0] - start_a[0]),
      start_a[1] + ua * (end_a[1] - start_a[1]),
      ua,
      ub
    ]; // return barycenric coordinates for alpha values in greiner-hormann
  }
  return null; // does not intersect

};

_polygon.TYPE_ISLAND = 0;
_polygon.TYPE_HOLE = 1;

_polygon.DIRECTION_INVALID = 0;
_polygon.DIRECTION_CLOCKWISE = 1;
_polygon.DIRECTION_COUNTERCLOCKWISE = -1;

_polygon.prototype.assert.prototype = _polygon.prototype;
_vector.prototype.assert.prototype = _vector.prototype;
_EF.prototype.assert.prototype = _EF.prototype;

var DIRECTION_NONE = 0,DIRECTION_FORWARD = 1,DIRECTION_OPPOSITE = 2, DIRECTION_BOTH = 3;
var OPERATION_INTERSECTION = 0,OPERATION_UNION = 1,OPERATION_DIFFERENCE = 2,OPERATION_REV_DIFFERENCE = 3;
var ORIENTATION_SAME = 1,ORIENTATION_OPPOSITE = -1;

var T_VERTEX_OUTSIDE = 0,T_VERTEX_INSIDE = 1,T_VERTEX_BOUNDARY = 2;

})();
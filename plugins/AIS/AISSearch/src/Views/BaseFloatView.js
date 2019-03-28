let _getMaxZindex = function(){
    let dialogs = document.querySelectorAll('.ui-dialog'),
    z,
    zMax = Array.from(document.querySelectorAll('.ui-front')).reduce((p,c)=>{
        z = parseFloat(getComputedStyle(c).zIndex);
        return isNaN(z) || z<=p ? p : z;
    }, 0);
    zMax = Array.from(document.querySelectorAll('.float_view')).reduce((p,c)=>{
        z = parseFloat(getComputedStyle(c).zIndex);
        return isNaN(z) || z<=p ? p : z;
    }, zMax);
    return zMax;
};
const BaseFloatView = function (){
    let frame = document.createElement("div"); 
    frame.className = "float_view";
    frame.style.position = "absolute";
    frame.style.display = "none";
    let x, y;
    frame.addEventListener('mousedown', e=>{
        if (!this.allowMove)
            return;
            
        x = e.clientX; y = e.clientY;
        frame.style.zIndex = _getMaxZindex();
        document.body.append(frame);
            
        if(e.stopPropagation) e.stopPropagation();
        if(e.preventDefault) e.preventDefault();
        e.cancelBubble=true;
        e.returnValue=false;
    });
    frame.addEventListener('mouseup', e=>{
        x = false; y = false;
    });
    document.body.addEventListener('mousemove', e=>{
        if (!x && !y)
            return;
        let dx = e.clientX - x, dy = e.clientY - y,
        rect = frame.getBoundingClientRect(),
        fx = rect.left, fy = rect.top;
        frame.style.left = fx + dx + "px";
        frame.style.top = fy + dy + "px";
        x = e.clientX; y = e.clientY;

        if(e.stopPropagation) e.stopPropagation();
        if(e.preventDefault) e.preventDefault();
        e.cancelBubble=true;
        e.returnValue=false;
    }); 
    this.frame = frame;   
    this.allowMove = true;
}

BaseFloatView.prototype = function () {
    return {
        get left(){ return this.frame.getBoundingClientRect().left; },
        set left(v){ this.frame.style.left = v + "px"; },
        get top(){ return this.frame.getBoundingClientRect().top; },
        set top(v){ this.frame.style.top = v + "px"; },
        get right(){ return this.frame.getBoundingClientRect().right; },
        get bottom(){ return this.frame.getBoundingClientRect().bottom; },
        get width(){ return this.frame.getBoundingClientRect().width; },
        set width(v){ this.frame.style.width = v + "px"; },
        get height(){ return this.frame.getBoundingClientRect().height; },
        set height(v){ this.frame.style.height = v + "px"; },
        show: function () {
            this.frame.style.zIndex = _getMaxZindex();
            document.body.append(this.frame);
            this.frame.style.display = "block";
        },
        hide: function () {
            this.frame.remove();
        }
    }
}();

module.exports = BaseFloatView;
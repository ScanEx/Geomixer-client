require("./SpecialFloatView.css")
const _cssClassName = "special";
const BaseFloatView = require('./BaseFloatView.js');
const SpecialFloatView = function (){
    BaseFloatView.apply(this, arguments);
    this.frame.innerHTML = '<div class="' + _cssClassName + '"></div><img class="img1"><img class="img2">';
    if (FormData.prototype.set)
        this.frame.innerHTML += '<table class="logos"><tr><td><img src="plugins/AIS/AISSearch/png/anchors.png" style="position: unset;"></td></tr>' +
        '<tr><td><img src="plugins/AIS/AISSearch/png/rscc-logo.png" style="position: unset;"></td></tr></table>';
    else
        this.frame.innerHTML += '<table class="logos" style="background:none"><tr><td></td></tr></table>';
    //     this.frame.innerHTML += '<table class="logos" style="width:98px; height: 66px">' +
    //     '<tr><td><img src="plugins/AIS/AISSearch/png/anchors.png" style="position: unset; left:2px; top: 2px"></td></tr>' +
    //     '<tr><td><img src="plugins/AIS/AISSearch/png/rscc-logo.png" style="position: unset; left:2px; top: 34px"></td></tr></table>';    
    this.left = -1000;

    this.contextMenu = document.createElement("div"); 
    this.contextMenu.className = 'mf_group_menu';
    this.contextMenu.innerHTML = '<div class="command zoomin">' + _gtxt('AISSearch2.zoomin_com') + '</div>' +
    '<div class="command zoomout" style="display:none">' + _gtxt('AISSearch2.zoomout_com') + '</div>' + 
    '<div class="command image1">' + _gtxt('AISSearch2.image1_com') + '</div>' + 
    '<div class="command image2">' + _gtxt('AISSearch2.image2_com') + '</div>' + 
    '<div class="command twoimages">' + _gtxt('AISSearch2.twoimages_com') + '</div>' + 
    '<div class="command close">' + _gtxt('AISSearch2.close_com') + '</div>';

    this.contextMenu.addEventListener('mousedown', (e=>{
        if(e.stopPropagation) e.stopPropagation();
        //if(e.preventDefault) e.preventDefault();
        e.cancelBubble=true;
        e.returnValue=false;
    }).bind(this)); 
    this.contextMenu.addEventListener('mouseleave', (e=>{
            this.contextMenu.style.display = "none";
            this.contextMenu.remove();
    }).bind(this));  

    let closeCom = this.contextMenu.querySelector('.close'),
    zinCom = this.contextMenu.querySelector('.zoomin'),
    zoutCom = this.contextMenu.querySelector('.zoomout'),
    img1Com = this.contextMenu.querySelector('.image1'),
    img2Com = this.contextMenu.querySelector('.image2'),
    twoimgCom = this.contextMenu.querySelector('.twoimages'),
    l, t , w , h,
    rc1, rc2,
    content = this.frame.querySelector('.'+_cssClassName),    
    image1 = this.frame.querySelector('img.img1'),
    image2 = this.frame.querySelector('img.img2'),
    logos = this.frame.querySelector('.logos'),
    showTwo = false,
    restoreSize = function(){
        let h1 = Math.floor(image1.getBoundingClientRect().height),
        h2 = Math.floor(image2.getBoundingClientRect().height);
        if (h1)        
            content.style.height = h1+"px"; 
        else if (h2)       
            content.style.height = h2+"px";
        showTwo = false;         
    },
    zoomIn = function(image, w, h, wiw, wih){
        let setPlace1 = function(){
            image.style.width = wiw + "px";
            image.style.height = "";

            image.style.left = 0;
            image.style.top = Math.round((wih - image.getBoundingClientRect().height)/2) + "px";
        },
        setPlace2 = function(){
            image.style.width = "";
            image.style.height = wih + "px";
 
            image.style.left = Math.round((wiw - image.getBoundingClientRect().width)/2) + "px"; 
            image.style.top = 0; 
        };
        if(wiw/wih>1)
            if(parseInt(w)/parseInt(h)>wiw/wih)
                setPlace1();
            else
                setPlace2();
        else
            if(parseInt(w)/parseInt(h)>wiw/wih)
                setPlace1();
            else
                setPlace2();
    },
    zoomIn2 = function(image1, image2, w, h, wiw, wih){
        let setPlace1 = function(){
            image1.style.width = wiw + "px";
            image2.style.width = wiw + "px";
            image1.style.height = "";
            image2.style.height = "";

            image1.style.left = 0;
            image2.style.left = 0;
            image1.style.top = Math.round(wih/2 - image1.getBoundingClientRect().height) + "px";           
            image2.style.top = image1.getBoundingClientRect().bottom + "px"; 
        },
        setPlace2 = function(){
            image1.style.width = "";
            image2.style.width = "";
            image1.style.height = Math.ceil(wih/2) + "px";
            image2.style.height = Math.floor(wih/2) + "px";

            image1.style.top = 0;       
            image2.style.top = image1.getBoundingClientRect().bottom + "px"; 
            image1.style.left = Math.round((wiw - image1.getBoundingClientRect().width)/2) + "px"; 
            image2.style.left = image1.style.left;             
        };
        if(wiw/wih>1)
            if(parseInt(w)/parseInt(h)>wiw/wih)
                setPlace1();
            else
                setPlace2();
        else
            if(parseInt(w)/parseInt(h)>wiw/wih)        
                setPlace1();
            else
                setPlace2();
    };
    closeCom.addEventListener("click",(e=>{ 
        !this.allowMove && zoutCom.click(); 
        this.contextMenu.remove(); 
        this.left = -1000;

        image1.style.display = "block";
        image2.style.display = "none";
        restoreSize();

        this.hide(); 
        image1.src = "";
        image2.src = "";
    }).bind(this));
    zinCom.addEventListener("click",(e=>{
        this.contextMenu.remove();
        e.srcElement.style.display = 'none'; 
        zoutCom.style.display = 'block';
        img1Com.style.display = 'none';
        img2Com.style.display = 'none';
        twoimgCom.style.display = 'none';
        let st = getComputedStyle(content);
        w = st.width; h = st.height; 
        l = this.left; t = this.top;
        this.left = 0; 
        this.top = 0;  

        content.style.width = window.innerWidth + "px";   
        content.style.height = window.innerHeight + "px"; 

        rc1 = image1.getBoundingClientRect();
        rc2 = image2.getBoundingClientRect();
        let wiw = window.innerWidth, wih = window.innerHeight;
// console.log((parseInt(w)+"/ "+parseInt(h)));
// console.log("w/h "+(parseInt(w)/parseInt(h)));
// console.log("wiw/wih "+(wiw/wih));

        if (rc1.width && rc1.height && !rc2.width && !rc2.height){
            zoomIn(image1, w, h, wiw, wih);
            logos.style.left = image1.style.left;
            logos.style.top = image1.style.top;
        }
        if (rc2.width && rc2.height && !rc1.width && !rc1.height){
            zoomIn(image2, w, h, wiw, wih);
            logos.style.left = image2.style.left;
            logos.style.top = image2.style.top;
        }
        if (rc2.width && rc2.height && rc1.width && rc1.height){
            zoomIn2(image1, image2, w, h, wiw, wih);
            logos.style.left = image1.style.left;
            logos.style.top = image1.style.top;
        }

        content.classList.add('zoomed_in');  
        image1.classList.add('zoomed_in');   
        image2.classList.add('zoomed_in'); 
        logos.classList.add('zoomed_in'); 
        this.allowMove = false;
    }).bind(this));
    zoutCom.addEventListener("click",(e=>{
        this.contextMenu.remove();
        e.srcElement.style.display = 'none'; 
        zinCom.style.display = 'block';
        img1Com.style.display = 'block';
        img2Com.style.display = 'block';
        twoimgCom.style.display = 'block';
        this.left = l; 
        this.top = t;
        content.style.width = w;   
        content.style.height = h; 

        if (rc1.width && rc1.height) {     
            image1.style.left = Math.floor(rc1.left) + "px";
            image1.style.top = Math.floor(rc1.top) + "px";              
            image1.style.height = Math.floor(rc1.height) + "px";
            image1.style.width = Math.floor(rc1.width) + "px"; 
        }
        if (rc2.width && rc2.height) {     
            image2.style.left = Math.floor(rc2.left) + "px";
            image2.style.top = Math.floor(rc2.top) + "px";       
            image2.style.height = Math.floor(rc2.height) + "px";
            image2.style.width = Math.floor(rc2.width) + "px";
        }        
        logos.style.left = 0;
        logos.style.top = 0;

        content.classList.remove('zoomed_in'); 
        image1.classList.remove('zoomed_in');   
        image2.classList.remove('zoomed_in');   
        logos.classList.remove('zoomed_in');  
        this.allowMove = true;  
    }).bind(this));
    img1Com.addEventListener("click",(e=>{
        this.contextMenu.remove();
        restoreSize();
        image1.style.top = 0;
        image1.style.display = "block";
        image2.style.display = "none";
    }).bind(this));
    img2Com.addEventListener("click",(e=>{
        this.contextMenu.remove();
        restoreSize();
        image2.style.top = 0;
        image2.style.display = "block";
        image1.style.display = "none";
    }).bind(this));
    twoimgCom.addEventListener("click",(e=>{
        showTwo = true;

        this.contextMenu.remove();
        image1.style.display = "block";
        image2.style.display = "block"; 
        let h1 = Math.floor(image1.getBoundingClientRect().height),
        h2 = Math.floor(image2.getBoundingClientRect().height);
        image2.style.top = Math.floor(h1)+"px";
        if (h1 || h2)
            content.style.height = (h1 + h2) + "px"; 
    }).bind(this));
    image1.addEventListener("click", (e=>{
        if(!this.allowMove)
            zoutCom.click();
    }).bind(this));
    image2.addEventListener("click", (e=>{
        if(!this.allowMove)
            zoutCom.click();
    }).bind(this));
    content.addEventListener("click", (e=>{
        if(!this.allowMove)
            zoutCom.click();
    }).bind(this));

    this.frame.addEventListener("contextmenu", (e=>{
        e.preventDefault();
        this.frame.append(this.contextMenu);
        this.contextMenu.style.display = "block";

        if ((e.clientX - 10 + this.contextMenu.offsetWidth) < window.innerWidth) { 
            this.contextMenu.style.left = (e.clientX - this.left - 10) + "px";
            this.contextMenu.style.right = "";
        }
        else{ 
            this.contextMenu.style.right = (this.right - e.clientX - 10) + "px";
            this.contextMenu.style.left = "";
        }
        if ((e.clientY - 10 + this.contextMenu.offsetHeight) < window.innerHeight) {
            this.contextMenu.style.top = (e.clientY - this.top - 10) + "px";
            this.contextMenu.style.bottom = "";
        }
        else {  
            this.contextMenu.style.bottom = (this.bottom - e.clientY - 10) + "px";
            this.contextMenu.style.top = "";
        }       
    }).bind(this));
}

SpecialFloatView.prototype = Object.create(BaseFloatView.prototype);

SpecialFloatView.prototype.show = function(){     
    BaseFloatView.prototype.show.apply(this, arguments); 
    if (this.left>-1000)
        return;
    this.left = document.defaultView.getWindowWidth() - this.width;
    this.top = 0;

    let content = this.frame.querySelector('.'+_cssClassName),
    image1 = this.frame.querySelector('img.img1'),
    image2 = this.frame.querySelector('img.img2'),
    rc = this.frame.getBoundingClientRect();

    let downloadingImage1 = new Image();
    downloadingImage1.onload = function(){
        image1.src = this.src; 
        image1.style.left = 0; image1.style.top = 0;
        image1.style.width = rc.width + "px";
        image1.style.height = getComputedStyle(image1).height;
//console.log(downloadingImage1.width)  
//console.log(this.width)  
//console.log(image1.getBoundingClientRect())  
        if (image1.getBoundingClientRect().height)        
            content.style.height = Math.floor(image1.getBoundingClientRect().height)+"px"; 
    };
    downloadingImage1.onerror = function (e) {
        image1.src = "";
        image1.style.height = "";
    };
    downloadingImage1.src = "//maps.kosmosnimki.ru/plugins/ais/50letpobedy.ashx?n=1&r=" + Math.random();

    let downloadingImage2 = new Image();
    downloadingImage2.onload = function () {
        image2.src = this.src;
        image2.style.left = 0; image2.style.top = 0;
        image2.style.width = rc.width + "px";
        image2.style.height = getComputedStyle(image2).height;
        image2.style.display = "none";
//console.log(image1.getBoundingClientRect())
    };
    downloadingImage2.onerror = function (e) {
        image2.src = "";
        image2.style.height = "";
    };
    downloadingImage2.src = "//maps.kosmosnimki.ru/plugins/ais/50letpobedy.ashx?n=2&r=" + Math.random();

    // UPDATE 
    let timer = setTimeout(function update() {
//console.log("TIME " + timer)
        let downloadingImage1 = new Image();
        downloadingImage1.onload = function () {
            image1.src = downloadingImage1.src;
        };
        // downloadingImage1.onerror = function (e) {
        //     image1.src = "";
        //     image1.style.height = "";
        // };
        downloadingImage1.src = "//maps.kosmosnimki.ru/plugins/ais/50letpobedy.ashx?n=1&r=" + Math.random();

        let downloadingImage2 = new Image();
        downloadingImage2.onload = function () {
            image2.src = downloadingImage2.src;
        };
        // downloadingImage2.onerror = function (e) {
        //     image2.src = "";
        //     image2.style.height = "";
        // };
        downloadingImage2.src = "//maps.kosmosnimki.ru/plugins/ais/50letpobedy.ashx?n=2&r=" + Math.random();
        if (timer){
            clearTimeout(timer);
            timer = setTimeout(update, 1000 * 60 * 5);
        }
    }.bind(this), 1000 * 60 * 5),
    
    closeCom = this.contextMenu.querySelector('.close');
    this.disposeTimer && closeCom.removeEventListener("click", this.disposeTimer);
    this.disposeTimer = function () {
//console.log("STOP TIME")
        clearTimeout(timer);
        timer = false;
    };
    closeCom.addEventListener("click", this.disposeTimer);
}

module.exports = SpecialFloatView;
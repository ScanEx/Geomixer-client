module.exports = function(container, options, active, callback){
    let _isOptionsDisplayed = false,
    _select = document.createElement('div'),
    _optionsList = document.createElement('div'),
    _selected = active; 

    _select.className = 'select-control';
    _select.innerHTML = `<span class="select-active">${options[active]}</span><span class="icon-down-open"></span>`;
    _optionsList.className = 'select-list';
    _optionsList.innerHTML = options.map((o, i)=>`<div class="select-options" id="${i}">${o}</div>`).join('');
    
    container.append(_select);
    document.body.append(_optionsList);

    const _arrow = _select.querySelector('.icon-down-open'),
    _options = _optionsList.querySelectorAll('.select-options'),
    _hideOptions = function(){
            _optionsList.style.display = 'none';
            _optionsList.querySelectorAll('.select-options')[_selected].classList.remove('selected');
            _arrow.classList.remove('icon-up-open');
            _arrow.classList.add('icon-down-open');
            _isOptionsDisplayed = false;
    };

    let _setOptionsRect = function(){
        let selectedRc = _select.getBoundingClientRect(),
            bw = parseInt(getComputedStyle(_optionsList).borderWidth);
        if (isNaN(bw)) bw = 0;
        _optionsList.style.width = selectedRc.width - 2 * bw + "px";
        _optionsList.style.top = selectedRc.bottom - 3 + "px";
        _optionsList.style.left = selectedRc.left + "px";  
    }  

    for (let i=0; i<_options.length; ++i)
        _options[i].addEventListener('click', e=>{
            _hideOptions();
            _selected = parseInt(e.srcElement.id);  
            _select.querySelector('.select-active').innerHTML = options[_selected];          
            callback(_selected);
        });

    _optionsList.addEventListener('mouseleave', e=>{
        _hideOptions();
    });
    _select.addEventListener('click', e=>{
//console.log(_isOptionsDisplayed)
        if (_isOptionsDisplayed){
            _hideOptions();
        }
        else{
            _setOptionsRect();
            _optionsList.style.display = 'block';
            _optionsList.querySelectorAll('.select-options')[_selected].classList.add('selected');
            _arrow.classList.remove('icon-down-open');
            _arrow.classList.add('icon-up-open');
            _isOptionsDisplayed = true;
        }
    });

    return {dropDownList: _optionsList};

}
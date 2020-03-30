

let _searchString = "",
_sparams = 'imo name mmsi';
const SearchControl = function ({ tab, container, callback, searchparams, searcher, placeholder }) {

    container.innerHTML = '<div class="filter"><input type="text" placeholder="' + placeholder + '"/>' +
        (!searchparams ? '' : '<div class="preferences"></div>') +
        '<div class="searchremove"><img class="search" src="plugins/AIS/AISSearch/svg/search.svg">' +
        '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg"></div>' +
        '</div>';
    let suggestions = tab.appendChild(document.createElement('div'));
    suggestions.classList.add("suggestions");
    suggestions.innerHTML = '<div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div>';

    this.frame = { find: (q) => { return container.querySelector(q) } };

    let preferences = false;
    if (searchparams){
        _sparams = localStorage.getItem(searchparams);
        preferences = tab.appendChild(document.createElement('div'));
        preferences.classList.add("preferences");
        preferences.innerHTML = '<div class="section">Поиск по:</div>' +
            '<div class="line"><div class="checkbox imo disabled"></div><div class="label">IMO<label></div></div>' +
            '<div class="line"><div class="checkbox mmsi"></div><div class="label">MMSI<label></div></div>' +
            '<div class="line"><div class="checkbox name disabled"></div><div class="label">названию</div></div>' +
            '<div class="line"><div class="checkbox callsign"></div><div class="label">позывному<label></div></div>' +
            '<div class="line"><div class="checkbox owner"></div><div class="label">собственнику<label></div></div>';
        !_sparams && (_sparams = 'imo name mmsi');
        if (_sparams.search(/imo/) < 0)
            _sparams += ' imo';
        if (_sparams.search(/name/) < 0)
            _sparams += ' name';
        let asparams = _sparams.split(' ');
        asparams.forEach((p, i) => { preferences.querySelector('.' + p).classList.add('checked') });
    }
    else{
        let sr = this.frame.find('.filter .searchremove');
        sr.style.borderRight = 'none';
        sr.style.paddingRight = 0;
        this.frame.find('.filter input').style.width = '85%';
    }

    this.frame = { find: (q) => { return container.querySelector(q) } }
    this.searchInput = this.frame.find('.filter input');

    let searchBut = this.frame.find('.filter .search'),
        prefeBut = this.frame.find('.filter .preferences'),
        removeBut = this.frame.find('.filter .remove'),
        delay,
        //suggestions = this.frame.find('.suggestions'),
        suggestionsCount = 5,
        suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 },
        found = { values: [] },
        searchDone = function () {
            if (found.values.length > 0) {
                _searchString = found.values[suggestionsFrame.current].vessel_name;
                this.searchInput.value = (_searchString);
                callback(found.values[suggestionsFrame.current]);
            }
            // else {
            //     _clean.call(this);
            // }
        },
        doSearch = function (actualId) {
            let requests = [];
            // _sparams.split(' ').forEach(sp=>{       
            //     requests.push(fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/" + sp + "/" + _searchString));
            // });
            requests.push(new searcher.searchpromise([{name:'query', value: [_searchString]}]));
            Promise.all(requests)
            .then(a=>{
//console.log(a)
                return Promise.all(a.map(r=>{
                    if (r.status != 200){
                        console.log(r)                       
                        return [];
                    }
                    else
                        return r.json()
                }))
            })
            .then(a=>{
//console.log(actualId+" "+delay)
                if (actualId==delay){
                    found = {values:[]};
                    a.forEach(r=>{found.values = found.values.concat( searcher.parser(r) );});
//console.log(found.values)
                }
                else 
                    return Promise.reject("stop")                    
            })
            .then(function () { // SUCCEEDED
//console.log(_searchString)
                if (found.values.length == 0 || _searchString == "") {
                    suggestions.style.display = 'none';
                    return;
                }

                let scrollCont = suggestions.querySelector('.mCSB_container'),
                    content = Handlebars.compile(
                        '{{#each values}}<div class="suggestion" id="{{@index}}">{{vessel_name}}<br><span>mmsi:{{mmsi}}, imo:{{imo}}, {{callsign}}</span><br><span>{{owner}}</span></div>{{/each}}'
                    )(found);
                if (!scrollCont) {
                    suggestions.innerHTML = (content);
                    $(suggestions).mCustomScrollbar();
                }
                else
                    scrollCont.innerHTML = (content);

                let suggestion = suggestions.querySelectorAll('.suggestion');
                if (suggestions.style.display != 'block') {
                    let cr = this.frame.find('.filter').getBoundingClientRect();
                    suggestions.style.display = 'block';
                    suggestions.style.position = 'fixed';
                    suggestions.style.left = cr.left + "px"; suggestions.style.top = (cr.bottom - 3) + "px";
                    suggestions.style.width = (Math.round(cr.width) - 2) + "px";
                    // $(suggestions).offset({ left: cr.left, top: cr.bottom - 3 });
                    // $(suggestions).outerWidth(cr.width)
                }

                suggestions.style.height = suggestion[0].getBoundingClientRect().height *
                    (found.values.length > suggestionsCount ? suggestionsCount : found.values.length) + "px";

                suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 };
                suggestion[suggestionsFrame.current].classList.add('selected');
                suggestion.forEach(((el, i) =>
                    el.onclick = (e => {
                        suggestionsFrame.current = e.currentTarget.id;
                        suggestions.style.display = 'none';
                        searchDone.call(this);
                    }).bind(this)
                ).bind(this));
            }.bind(this),
            function (response) { // FAILED
                if (response!="stop")
                    console.log(response);
            });
        };

    tab.addEventListener('click', function (e) {
        suggestions.style.display = 'none';
    });
    if (preferences) {
        tab.addEventListener('click', function (e) {
            preferences.style.display = 'none';
        });
        prefeBut.onclick = function (e) {
            if (preferences.style.display != 'block') {
                let cr = this.frame.find('.filter').getBoundingClientRect();
                preferences.style.display = 'block';
                preferences.style.position = 'fixed';
                preferences.style.left = (cr.left + (cr.width - preferences.offsetWidth) / 2) + "px";
                preferences.style.top = (cr.bottom + 10) + "px";
                e.stopPropagation()
            }
        }.bind(this);

        preferences.querySelectorAll('.line').forEach(el => el.onclick = e => {
            let ch = el.querySelector('.checkbox');
            if (!ch.classList.contains('disabled')) {
                let sparam = ch.classList.value.replace(/ *(checked|checkbox) */g, '');
                if (ch.classList.contains('checked')) {
                    ch.classList.remove('checked');
                    _sparams = _sparams.replace(new RegExp(sparam), '').replace(/ {2,}/g, ' ');
                }
                else {
                    ch.classList.add('checked');
                    _sparams = _sparams + ' ' + sparam;
                }
                _sparams = _sparams.replace(/^\s+|\s+$/g, '')
                localStorage.setItem(searchparams, _sparams);
                //console.log(_sparams)
            }
            e.stopPropagation()
        });
    }
    
    removeBut.onclick = (function (e) {
        _searchString = '';
        callback(null);
        this.searchInput.value = ('');
        this.searchInput.focus();
        clearTimeout(delay)
        removeBut.style.display = 'none';
        searchBut.style.display = 'block';
        suggestions.style.display = 'none';
        //_clean.call(this);
    }.bind(this));

    this.searchInput.onkeydown = (function (e) {
        let suggestion = suggestions.querySelector('.suggestion.selected');
        if (suggestions.style.display == 'block') {
            if (e.keyCode == 38) {
                if (suggestionsFrame.current > 0) {
                    suggestionsFrame.current--;
                    suggestion.classList.remove('selected')
                    suggestion.previousSibling.classList.add('selected');
                }
            }
            else if (e.keyCode == 40) {
                if (suggestionsFrame.current < found.values.length - 1) {
                    suggestionsFrame.current++;
                    suggestion.classList.remove('selected')
                    suggestion.nextSibling.classList.add('selected');
                }
            }
            if (suggestionsFrame.last < suggestionsFrame.current) {
                suggestionsFrame.last = suggestionsFrame.current;
                suggestionsFrame.first = suggestionsFrame.last - (suggestionsCount - 1);
            }
            if (suggestionsFrame.first > suggestionsFrame.current) {
                suggestionsFrame.first = suggestionsFrame.current;
                suggestionsFrame.last = suggestionsFrame.first + (suggestionsCount - 1);
            }

            $(suggestions).mCustomScrollbar("scrollTo", "#" + suggestionsFrame.first, { scrollInertia: 0 });
        }
    });

    let prepareSearchInput = function (temp, keyCode) {
        removeBut.style.display = 'block';
        searchBut.style.display = 'none';
//console.log("delay clear"+delay)
//console.log(_searchString + "=="+ temp)
        if (_searchString == temp && (!keyCode || keyCode != 13))
            return false;

        clearTimeout(delay);

        _searchString = temp;
        if (_searchString == "") {
            removeBut.click();
            return false;
        }
        return true;
    }

    this.searchInput.onkeyup = (function (e) {
        let temp = (this.searchInput.value || "")
            .replace(/^\s+/, "").replace(/\s+$/, "");
        if (!prepareSearchInput(temp, e.keyCode))
            return;
        if (e.keyCode == 13) {
            suggestions.style.display = 'none';
            searchDone.call(this);
        }
        else{
            delay = setTimeout((() => {
                doSearch.apply(this, [delay])
            }).bind(this), 200);
        }
    }.bind(this));


    this.searchInput.onpaste = function (e) {
        let temp = ((e.originalEvent || window.clipboardData || e).clipboardData.getData('text') || "")
            .replace(/^\s+/, "").replace(/\s+$/, "");
        if (!prepareSearchInput(temp))
            return;
        delay = setTimeout((() => {
            doSearch.call(this, [delay])
        }).bind(this), 200);
    }.bind(this);

}

SearchControl.prototype.focus = function () {
    this.searchInput.focus();
}

module.exports = SearchControl;
//event: change
nsGmx.ShpEncodingWidget = function()
{
    var _encodings = {
        'windows-1251': 'windows-1251',
        'utf-8': 'utf-8',
        'koi8-r': 'koi8-r',
        'utf-7': 'utf-7',
        'iso-8859-5': 'iso-8859-5',
        'koi8-u': 'koi8-u',
        'cp866': 'cp866'
        
    };
    var _DEFAULT_ENCODING = 'windows-1251';
    var _curEncoding = _DEFAULT_ENCODING;
    var _this = this;
    
    this.drawWidget = function(container, initialEncoding)
    {
        initialEncoding = initialEncoding || _DEFAULT_ENCODING;
        var select = $("<select></select>").addClass('selectStyle VectorLayerEncodingInput');
        select.change(function()
        {
            _curEncoding = $('option:selected', select).val();
            $(_this).change();
        });
        
        var isStandard = false;
        for (var enc in _encodings)
        {
            var opt = $('<option></option>').val(enc).text(enc);
            
            if (_encodings[enc] === initialEncoding)
            {
                opt.attr('selected', 'selected');
                _curEncoding = enc;
                isStandard = true;
            }
                
            select.append(opt);
        }
        
        var anotherCheckbox = $("<input></input>", {'class': 'box', type: 'checkbox', id: 'otherEncoding'});
        var anotherInput = $("<input></input>", {'class': 'VectorLayerEncodingInput'});
        
        if (!isStandard)
        {
            anotherCheckbox[0].checked = 'checked';
            anotherInput.val(initialEncoding);
            select.attr('disabled', 'disabled');
        }
        else
        {
            anotherInput.attr('disabled', 'disabled');
        }
        
        anotherInput.bind('keyup', function()
        {
            _curEncoding = this.value;
            $(_this).change();
        });
        
        anotherCheckbox.click(function()
        {
            if (this.checked)
            {
                select.attr('disabled', 'disabled');
                anotherInput.removeAttr('disabled');
                anotherInput.focus();
                _curEncoding = anotherInput.val();
            }
            else
            {
                select.removeAttr('disabled');
                anotherInput.attr('disabled', 'disabled');
                _curEncoding = $('option:selected', select).val();
            }
            $(_this).change();
        });
        
        
        var tr1 = $("<tr></tr>")
            .append($("<td></td>").text(_gtxt("Кодировка")))
            .append($("<td></td>").append(select));
            
        var tr2 = $("<tr></tr>")
            .append($("<td></td>").append(anotherCheckbox).append($("<label></label>", {'for': 'otherEncoding'}).text(_gtxt("Другая"))))
            .append($("<td></td>").append(anotherInput));
        
        $(container)
            .append($("<table></table>", {'class': 'VectorLayerEncoding'})
                .append(tr1).append(tr2));
    }
    
    this.getServerEncoding = function()
    {
        return _curEncoding;
    }
};
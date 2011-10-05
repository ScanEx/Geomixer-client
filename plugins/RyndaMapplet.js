(function(){

	_translationsHash.addtext("rus", {
							"RyndaMapplet.Description" : "Сообщения Рынды"
						 });
						 
	_translationsHash.addtext("eng", {
							"RyndaMapplet.Description" : "Rynda Messages"
						 });

	var RyndaProvider = function()
	{
		this.getDescription = function() { return _gtxt("RyndaMapplet.Description"); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			var timestepFrom = Math.round(dateBegin.valueOf()/1000);
			var timestepTo = Math.round(dateEnd.valueOf()/1000);
			var url = "http://rynda.org/public_api/messages?format=jsonp&date_added_from=" + timestepFrom + "&date_added_to=" + timestepTo;
			
			//sendCrossDomainJSONRequest(serverBase + "ApiSave.ashx?get=" + encodeURIComponent(url), function(data)
			$.ajax({url: url, dataType: 'jsonp', success: function(data)
			{
				//eval("var k = " + data.Result);
				onSucceess(data);
			}});
		}
	};
	
	var RyndaRenderer = function()
	{
		var _container = null;
		
		this.bindData = function(data)
		{
			if (_container)
				_container.remove();
			
			_container = globalFlashMap.addObject();
			
			for (var i = 0; i < data.data.length; i++)
			{
				var obj = _container.addObject({
						type: "POINT", 
						coordinates: [parseFloat(data.data[i].lng), parseFloat(data.data[i].lat)]
					}, 
					{
						title: data.data[i].title,
						text: data.data[i].text,
						dateString: $.datepicker.formatDate('dd.mm.yy', new Date(data.data[i].date_added*1000))
					});
				obj.setStyle({marker: {image: "http://maps.kosmosnimki.ru/images/fires.png", center: true}});
			}
			
			_container.enableHoverBalloon(function(obj)
			{
				return obj.properties.title + "<br/>" + obj.properties.dateString;
			}, 
			{
				OnClickSwitcher: function(obj)
				{
					var canvas = _div(null, [['dir', 'className', 'RyndaText']]);
					canvas.innerHTML = obj.properties.text;
					showDialog("Информационное сообщение Рынды", canvas, 400, 300);
					return true;
				}
			});
		}
		
		this.setVisible = function( isVisible )
		{
			if (_container) _container.setVisible( isVisible );
		}
	};
	
	var addRyndaProvider = function(fireControl)
	{
		fireControl.whenInited(function()
		{
			fireControl.addDataProvider( "rynda",
				new RyndaProvider(),
				new RyndaRenderer(),
				{ isVisible: true }
			);
		});
	}

	gmxCore.addModule('RyndaMapplet', {
		//RyndaProvider: RyndaProvider,
		//RyndaRenderer: RyndaRenderer
		afterViewer: function(params)
		{
			gmxCore.loadModule('FireMapplet', 'plugins/FireMapplet.js');
			gmxCore.addModulesCallback(['FireMapplet'], function(mFire)
			{
				if (mFire.FireControlCollection.instances.length)
					addRyndaProvider(mFire.FireControlCollection.instances[0])
				else
					$(mFire.FireControlCollection).bind('newInstance', function(){ addRyndaProvider(mFire.FireControlCollection.instances[0]) });
				// mapCalendar.whenInited(function()
				// {
					// mapCalendar.getFireControl().addDataProvider( "rynda",
						// new RyndaProvider(),
						// new RyndaRenderer(),
						// { isVisible: true }
					// );
				// });
			});
		}
	}, 
	{ init: function(module, path)
		{
			var doLoadCss = function()
			{
				path = path || window.gmxJSHost || "";
				$.getCSS(path + "RyndaMapplet.css");
			}
			
			if ('getCSS' in $)
				doLoadCss();
			else
				$.getScript(path + "../jquery/jquery.getCSS.js", doLoadCss);
		}
	});

})();
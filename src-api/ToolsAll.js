//Управление ToolsAll
(function()
{
	/** Класс управления ToolsAll
	* @function
	* @memberOf api
	* @param {cont} HTML контейнер для tools
	*/
	function ToolsAll(cont)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var toolsContHash = {};
		var objects = {};
		var currentlyDrawnObject = false;
		var activeToolName = false;
		var toolControls = {};

		var toolPlaqueX = 355;
		var toolPlaqueY = 40;
		var toolSize = 24;
		var toolPadding = 4;
		var toolSpacing = 8;

		var toolsAllCont = cont;
		this.toolsAllCont = toolsAllCont;
		gmxAPI._toolsContHash = toolsContHash;

		var toolsMinimized;
		var toolPlaqueControl = gmxAPI.newElement(
			"img",
			{
				onclick: function()
				{
					if (toolsMinimized)
						gmxAPI.map.maximizeTools();
					else
						gmxAPI.map.minimizeTools();
				},
				onmouseover: function()
				{
					if (toolsMinimized)
						this.src = apiBase + "img/tools_off_a.png";
					else
						this.src = apiBase + "img/tools_on_a.png";
				},
				onmouseout: function()
				{
					if (toolsMinimized)
						this.src = apiBase + "img/tools_off.png";
					else
						this.src = apiBase + "img/tools_on.png";
				}
			},
			{
				position: "absolute",
				left: "8px",
				top: "8px",
				cursor: "pointer"
			}
		);
		
		var toolPlaqueBackground = gmxAPI.newStyledDiv({
			position: "absolute",
			left: "5px",
			top: "5px",
			width: "32px",
			height: "32px",
			backgroundColor: "#016a8a",
			opacity: 0.5
		});
		gmxAPI._div.appendChild(toolPlaqueBackground);
		gmxAPI._div.appendChild(toolPlaqueControl);

		gmxAPI.map.minimizeTools = function()
		{
			toolsMinimized = true;
			toolPlaqueControl.src = apiBase + "img/tools_off.png";
			toolPlaqueControl.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать инструменты", "Show tools");
			gmxAPI.setVisible(toolsAllCont, false);
		}
		gmxAPI.map.maximizeTools = function()
		{
			toolsMinimized = false;
			toolPlaqueControl.src = apiBase + "img/tools_on.png";
			toolPlaqueControl.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Скрыть инструменты", "Hide tools");
			gmxAPI.setVisible(toolsAllCont, true);
		}
		gmxAPI.map.maximizeTools();

		gmxAPI.map.allControls = {
			div: toolsAllCont,
			setVisible: function(flag)
			{
				gmxAPI.setVisible(toolPlaqueBackground, flag);
				gmxAPI.setVisible(toolPlaqueControl, flag);
				gmxAPI.setVisible(allTools, flag);
			},
			minimize: gmxAPI.map.minimizeTools,
			maximize: gmxAPI.map.maximizeTools
		}

		var attr = {
			'properties': { 'className': 'gmxTools' }
			,
			'style': { }
			,
			'regularStyle': {
				paddingTop: "0px", 
				paddingBottom: "0px", 
				paddingLeft: "0px", 
				paddingRight: "0px", 
				fontSize: "12px",
				fontFamily: "sans-serif",
				fontWeight: "bold",
				textAlign: "center",
				cursor: "pointer", 
				opacity: 1, 
				color: "wheat"
			}
			,
			'activeStyle': {
				paddingTop: "0px", 
				paddingBottom: "0px", 
				paddingLeft: "0px", 
				paddingRight: "0px", 
				fontSize: "12px",
				fontFamily: "sans-serif",
				fontWeight: "bold",
				textAlign: "center",
				cursor: "pointer", 
				opacity: 1, 
				color: 'orange'
			}
			,
			'contType': 1	// режим для drawing tools
		};
		var standartTools = new gmxAPI._ToolsContainer('standart', attr);
		var arr = [
			{
				'key': "move",
				'regularImageUrl': apiBase + "img/move_tool.png",
				'activeImageUrl': apiBase + "img/move_tool_a.png",
				'onClick': gmxAPI._drawFunctions['move'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Перемещение", "Move")
			}
			,
			{
				'key': "zoom",
				'regularImageUrl': apiBase + "img/select_tool.png",
				'activeImageUrl': apiBase + "img/select_tool_a.png",
				'onClick': gmxAPI._drawFunctions['zoom'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "Zoom")
			}
			,
			{
				'key': "POINT",
				'regularImageUrl': apiBase + "img/marker_tool.png",
				'activeImageUrl': apiBase + "img/marker_tool_a.png",
				'onClick': gmxAPI._drawFunctions['POINT'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
			}
			,
			{
				'key': "LINESTRING",
				'regularImageUrl': apiBase + "img/line_tool.png",
				'activeImageUrl': apiBase + "img/line_tool_a.png",
				'onClick': gmxAPI._drawFunctions['LINESTRING'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
			}
			,
			{
				'key': "POLYGON",
				'regularImageUrl': apiBase + "img/polygon_tool.png",
				'activeImageUrl': apiBase + "img/polygon_tool_a.png",
				'onClick': gmxAPI._drawFunctions['POLYGON'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Полигон", "Polygon")
			}
			,
			{
				'key': "FRAME",
				'regularImageUrl': apiBase + "img/frame_tool.png",
				'activeImageUrl': apiBase + "img/frame_tool_a.png",
				'onClick': gmxAPI._drawFunctions['FRAME'],
				'onCancel': function() {},
				'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Рамка", "Rectangle")
			}
		];
		for(var i=0; i<arr.length; i++) {
			var ph = arr[i]['key']
			standartTools.addTool(arr[i]['key'], arr[i]);
		}
		standartTools.selectTool("move");
		this.standartTools = standartTools;

		var regularStyle = {
			paddingTop: "4px", 
			paddingBottom: "4px", 
			paddingLeft: "10px", 
			paddingRight: "10px", 
			fontSize: "12px",
			fontFamily: "sans-serif",
			fontWeight: "bold",
			textAlign: "center",
			cursor: "pointer", 
			opacity: 1, 
			color: "white"
		};
		var activeStyle = {
			paddingTop: "4px", 
			paddingBottom: "4px", 
			paddingLeft: "10px", 
			paddingRight: "10px", 
			fontSize: "12px",
			fontFamily: "sans-serif",
			fontWeight: "bold",
			textAlign: "center",
			cursor: "pointer", 
			opacity: 1, 
			color: 'orange'
		};
		var attr = {
			'properties': { 'className': 'gmxTools' }
			,
			'style': { }
			,
			'regularStyle': regularStyle
			,
			'activeStyle': activeStyle
			,
			'contType': 2	// режим отключения выбора item
		};

		var baseLayersTools = new gmxAPI._ToolsContainer('baseLayers', attr);

		this.baseLayersTools = baseLayersTools;
	}
    gmxAPI._ToolsAll = ToolsAll;
})();

//Управление ToolsAll
(function()
{
    //Управление ToolsAll
	/** Класс управления ToolsAll
	* @function
	* @memberOf api
	* @param {cont} HTML контейнер для tools
	*/
	function ToolsAll(cont)
	{
		this.toolsAllCont = gmxAPI._allToolsDIV;
		gmxAPI._toolsContHash = {};
	}
    gmxAPI._ToolsAll = ToolsAll;
})();

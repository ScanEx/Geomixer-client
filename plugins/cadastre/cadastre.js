(function(){

var extendJQuery;
extendJQuery = function() {
	$('input.inputStyle').each(function(){
		$(this)
		.data('default', $(this).val())
		.addClass('inactive')
		.focus(function() {
			$(this).removeClass('inactive');
			if($(this).val() === $(this).data('default') || $(this).val() === '') {
				$(this).val('');
			}
		})
		.blur(function() {
			if($(this).val() === '') {
				$(this).addClass('inactive').val($(this).data('default'));
			}
		});
	});
}
extendJQuery();

var mapListenerInfo,cadastreLayerListener; // Listener для идентификации кадастрового участка на карте
var balloonInfo,balloonSearch; // balloon для идентификации и поиска кадастрового участка на карте
var cadastreLayerInfo,cadastreLayerSearch;
var cadastreServer;

//================справочники Росреестра===============================//
var PARCEL_STATES = ['Ранее учтенный', '', 'Условный', 'Внесенный', 'Временный (Удостоверен)', 'Учтенный', 'Снят с учета', 'Аннулированный'];
var UNITS =  {"003":"мм","004":"см","005":"дм","006":"м","008":"км","009":"Мм","047":"морск. м.","050":"кв. мм","051":"кв. см","053":"кв. дм","055":"кв. м","058":"тыс. кв. м","059":"га","061":"кв. км","109":"а","359":"сут.","360":"нед.","361":"дек.","362":"мес.","364":"кварт.","365":"полугод.","366":"г.","383":"руб.","384":"тыс. руб.","385":"млн. руб.","386":"млрд. руб.","1000":"неопр.","1001":"отсутств.","1002":"руб. за кв. м","1003":"руб. за а","1004":"руб. за га","1005":"иные"};
var NO_DATA = "Нет данных";
var CATEGORY_TYPES = { "003001000000":"Земли сельскохозяйственного назначения","003002000000":"Земли поселений (земли населенных пунктов)","003003000000":"Земли промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, земли для обеспечения космической деятельности, земли обороны, безопасности и земли иного специального назначения","003004000000":"Земли особо охраняемых территорий и объектов","003005000000":"Земли лесного фонда","003006000000":"Земли водного фонда","003007000000":"Земли запаса","003008000000":"Категория не установлена"};
var UTILIZATIONS = {"141000000000":"Для размещения объектов сельскохозяйственного назначения и сельскохозяйственных угодий","141001000000":"Для сельскохозяйственного производства","141001010000":"Для использования в качестве сельскохозяйственных угодий","141001020000":"Для размещения зданий, строений, сооружений, используемых для производства, хранения и первичной переработки сельскохозяйственной продукции","141001030000":"Для размещения внутрихозяйственных дорог и коммуникаций","141001040000":"Для размещения водных объектов","141002000000":"Для ведения крестьянского (фермерского) хозяйства","141003000000":"Для ведения личного подсобного хозяйства","141004000000":"Для ведения гражданами садоводства и огородничества","141005000000":"Для ведения гражданами животноводства","141006000000":"Для дачного строительства","141007000000":"Для размещения древесно-кустарниковой растительности, предназначенной для защиты земель от воздействия негативных (вредных) природных, антропогенных и техногенных явлений","141008000000":"Для научно-исследовательских целей","141009000000":"Для учебных целей","141010000000":"Для сенокошения и выпаса скота гражданами","141011000000":"Фонд перераспределения","141012000000":"Для размещения объектов охотничьего хозяйства","141013000000":"Для размещения объектов рыбного хозяйства","141014000000":"Для иных видов сельскохозяйственного использования","142000000000":"Для размещения объектов, характерных для населенных пунктов","142001000000":"Для объектов жилой застройки","142001010000":"Для индивидуальной жилой застройки","142001020000":"Для многоквартирной застройки","142001020100":"Для малоэтажной застройки","142001020200":"Для среднеэтажной застройки","142001020300":"Для многоэтажной застройки","142001020400":"Для иных видов жилой застройки","142001030000":"Для размещения объектов дошкольного, начального, общего и среднего (полного) общего образования","142001040000":"Для размещения иных объектов, допустимых в жилых зонах и не перечисленных в классификаторе","142002000000":"Для объектов общественно-делового значения","142002010000":"Для размещения объектов социального и коммунально-бытового назначения","142002020000":"Для размещения объектов здравоохранения","142002030000":"Для размещения объектов культуры","142002040000":"Для размещения объектов торговли","142002040100":"Для размещения объектов розничной торговли","142002040200":"Для размещения объектов оптовой торговли","142002050000":"Для размещения объектов общественного питания","142002060000":"Для размещения объектов предпринимательской деятельности","142002070000":"Для размещения объектов среднего профессионального и высшего профессионального образования","142002080000":"Для размещения административных зданий","142002090000":"Для размещения научно-исследовательских учреждений","142002100000":"Для размещения культовых зданий","142002110000":"Для стоянок автомобильного транспорта","142002120000":"Для размещения объектов делового назначения, в том числе офисных центров","142002130000":"Для размещения объектов финансового назначения","142002140000":"Для размещения гостиниц","142002150000":"Для размещения подземных или многоэтажных гаражей","142002160000":"Для размещения индивидуальных гаражей","142002170000":"Для размещения иных объектов общественно-делового значения, обеспечивающих жизнь граждан","142003000000":"Для общего пользования (уличная сеть)","142004000000":"Для размещения объектов специального назначения","142004010000":"Для размещения кладбищ","142004020000":"Для размещения крематориев","142004030000":"Для размещения скотомогильников","142004040000":"Под объектами размещения отходов потребления","142004050000":"Под иными объектами специального назначения","142005000000":"Для размещения коммунальных, складских объектов","142006000000":"Для размещения объектов жилищно-коммунального хозяйства","142007000000":"Для иных видов использования, характерных для населенных пунктов","143000000000":"Для размещения объектов промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, обеспечения космической деятельности, обороны, безопасности и иного специального назначения","143001000000":"Для размещения промышленных объектов","143001010000":"Для размещения производственных и административных зданий, строений, сооружений и обслуживающих их объектов","143001010100":"Для размещения производственных зданий","143001010200":"Для размещения коммуникаций","143001010300":"Для размещения подъездных путей","143001010400":"Для размещения складских помещений","143001010500":"Для размещения административных зданий","143001010600":"Для размещения культурно-бытовых зданий","143001010700":"Для размещения иных сооружений промышленности","143001020000":"Для добычи и разработки полезных ископаемых","143001030000":"Для размещения иных объектов промышленности","143002000000":"Для размещения объектов энергетики","143002010000":"Для размещения электростанций и обслуживающих сооружений и объектов","143002010100":"Для размещения гидроэлектростанций","143002010200":"Для размещения атомных станций","143002010300":"Для размещения ядерных установок","143002010400":"Для размещения пунктов хранения ядерных материалов и радиоактивных веществ энергетики","143002010500":"Для размещения хранилищ радиоактивных отходов","143002010600":"Для размещения тепловых станций","143002010700":"Для размещения иных типов электростанций","143002010800":"Для размещения иных обслуживающих сооружений и объектов","143002020000":"Для размещения объектов электросетевого хозяйства","143002020100":"Для размещения воздушных линий электропередачи","143002020200":"Для размещения наземных сооружений кабельных линий электропередачи","143002020300":"Для размещения подстанций","143002020400":"Для размещения распределительных пунктов","143002020500":"Для размещения других сооружений и объектов электросетевого хозяйства","143002030000":"Для размещения иных объектов энергетики","143003000000":"Для размещения объектов транспорта","143003010000":"Для размещения и эксплуатации объектов железнодорожного транспорта","143003010100":"Для размещения железнодорожных путей и их конструктивных элементов","143003010200":"Для размещения полос отвода железнодорожных путей","143003010300":"Для размещения, эксплуатации, расширения и реконструкции строений, зданий, сооружений, в том числе железнодорожных вокзалов, железнодорожных станций, а также устройств и других объектов, необходимых для эксплуатации, содержания, строительства, реконструкции, ремонта, развития наземных и подземных зданий, строений, сооружений, устройств и других объектов железнодорожного транспорта","143003010301":"Для размещения железнодорожных вокзалов","143003010302":"Для размещения железнодорожных станций","143003010303":"Для размещения устройств и других объектов, необходимых для эксплуатации, содержания, строительства, реконструкции, ремонта, развития наземных и подземных зданий, строений, сооружений, устройств и других объектов железнодорожного транспорта","143003020000":"Для размещения и эксплуатации объектов автомобильного транспорта и объектов дорожного хозяйства","143003020100":"Для размещения автомобильных дорог и их конструктивных элементов","143003020200":"Для размещения полос отвода","143003020300":"Для размещения объектов дорожного сервиса в полосах отвода автомобильных дорог","143003020400":"Для размещения дорожных сооружений","143003020500":"Для размещения автовокзалов и автостанций","143003020600":"Для размещения иных объектов автомобильного транспорта и дорожного хозяйства","143003030000":"Для размещения и эксплуатации объектов морского, внутреннего водного транспорта","143003030100":"Для размещения искусственно созданных внутренних водных путей","143003030200":"Для размещения морских и речных портов, причалов, пристаней","143003030300":"Для размещения иных объектов морского, внутреннего водного транспорта","143003030400":"Для выделения береговой полосы","143003040000":"Для размещения и эксплуатации объектов воздушного транспорта","143003040100":"Для размещения аэропортов и аэродромов","143003040200":"Для размещения аэровокзалов","143003040300":"Для размещения взлетно-посадочных полос","143003040400":"Для размещения иных наземных объектов воздушного транспорта","143003050000":"Для размещения и эксплуатации объектов трубопроводного транспорта","143003050100":"Для размещения нефтепроводов","143003050200":"Для размещения газопроводов","143003050300":"Для размещения иных трубопроводов","143003050400":"Для размещения иных объектов трубопроводного транспорта","143003060000":"Для размещения и эксплуатации иных объектов транспорта","143004000000":"Для размещения объектов связи, радиовещания, телевидения, информатики","143004010000":"Для размещения эксплуатационных предприятий связи и обслуживания линий связи","143004020000":"Для размещения кабельных, радиорелейных и воздушных линий связи и линий радиофикации на трассах кабельных и воздушных линий связи и радиофикации и их охранные зоны","143004030000":"Для размещения подземных кабельных и воздушных линий связи и радиофикации и их охранные зоны","143004040000":"Для размещения наземных и подземных необслуживаемых усилительных пунктов на кабельных линиях связи и их охранные зоны","143004050000":"Для размещения наземных сооружений и инфраструктур спутниковой связи","143004060000":"Для размещения иных объектов связи, радиовещания, телевидения, информатики","143005000000":"Для размещения объектов, предназначенных для обеспечения космической деятельности","143005010000":"Для размещения космодромов, стартовых комплексов и пусковых установок","143005020000":"Для размещения командно-измерительных комплексов, центров и пунктов управления полетами космических объектов, приема, хранения и переработки информации","143005030000":"Для размещения баз хранения космической техники","143005040000":"Для размещения полигонов приземления космических объектов и взлетно-посадочных полос","143005050000":"Для размещения объектов экспериментальной базы для отработки космической техники","143005060000":"Для размещения центров и оборудования для подготовки космонавтов","143005070000":"Для размещения других наземных сооружений и техники, используемых при осуществлении космической деятельности","143006000000":"Для размещения объектов, предназначенных для обеспечения обороны и безопасности","143006010000":"Для обеспечения задач обороны","143006010100":"Для размещения военных организаций, учреждений и других объектов","143006010200":"Для дислокации войск и сил флота","143006010300":"Для проведения учений и иных мероприятий","143006010400":"Для испытательных полигонов","143006010500":"Для мест уничтожения оружия и захоронения отходов","143006010600":"Для создания запасов материальных ценностей в государственном и мобилизационном резервах (хранилища, склады и другие)","143006010700":"Для размещения иных объектов обороны","143006020000":"Для размещения объектов (территорий), обеспечивающих защиту и охрану Государственной границы Российской Федерации","143006020100":"Для обустройства и содержания инженерно-технических сооружений и заграждений","143006020200":"Для обустройства и содержания пограничных знаков","143006020300":"Для обустройства и содержания пограничных просек","143006020400":"Для обустройства и содержания коммуникаций","143006020500":"Для обустройства и содержания пунктов пропуска через Государственную границу Российской Федерации","143006020600":"Для размещения иных объектов для защиты и охраны Государственной границы Российской Федерации","143006030000":"Для размещения иных объектов обороны и безопасности","143007000000":"Для размещения иных объектов промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, обеспечения космической деятельности, обороны, безопасности и иного специального назначения","144000000000":"Для размещения особо охраняемых историко-культурных и природных объектов (территорий)","144001000000":"Для размещения особо охраняемых природных объектов (территорий)","144001010000":"Для размещения государственных природных заповедников (в том числе биосферных)","144001020000":"Для размещения государственных природных заказников","144001030000":"Для размещения национальных парков","144001040000":"Для размещения природных парков","144001050000":"Для размещения дендрологических парков","144001060000":"Для размещения ботанических садов","144001070000":"Для размещения объектов санаторного и курортного назначения","144001080000":"Территории месторождений минеральных вод, лечебных грязей, рапы лиманов и озер","144001090000":"Для традиционного природопользования","144001100000":"Для размещения иных особо охраняемых природных территорий (объектов)","144002000000":"Для размещения объектов (территорий) природоохранного назначения","144003000000":"Для размещения объектов (территорий) рекреационного назначения","144003010000":"Для размещения домов отдыха, пансионатов, кемпингов","144003020000":"Для размещения объектов физической культуры и спорта","144003030000":"Для размещения туристических баз, стационарных и палаточных туристско-оздоровительных лагерей, домов рыболова и охотника, детских туристических станций","144003040000":"Для размещения туристических парков","144003050000":"Для размещения лесопарков","144003060000":"Для размещения учебно-туристических троп и трасс","144003070000":"Для размещения детских и спортивных лагерей","144003080000":"Для размещения скверов, парков, городских садов","144003090000":"Для размещения пляжей","144003100000":"Для размещения иных объектов (территорий) рекреационного назначения","144004000000":"Для размещения объектов историко-культурного назначения","144004010000":"Для размещения объектов культурного наследия народов Российской Федерации (памятников истории и культуры), в том числе объектов археологического наследия","144004020000":"Для размещения военных и гражданских захоронений","144005000000":"Для размещения иных особо охраняемых историко-культурных и природных объектов (территорий)","145000000000":"Для размещения объектов лесного фонда","145001000000":"Для размещения лесной растительности","145002000000":"Для восстановления лесной растительности","145003000000":"Для прочих объектов лесного хозяйства","146000000000":"Для размещения объектов водного фонда","146001000000":"Под водными объектами","146002000000":"Для размещения гидротехнических сооружений","146003000000":"Для размещения иных сооружений, расположенных на водных объектах","147000000000":"Земли запаса (неиспользуемые)","014001000000":"Земли жилой застройки","014001001000":"Земли под жилыми домами многоэтажной и повышенной этажности застройки","014001002000":"Земли под домами индивидуальной жилой застройкой","014001003000":"Незанятые земли, отведенные под жилую застройку","014002000000":"Земли общественно-деловой застройки","014002001000":"Земли гаражей и автостоянок","014002002000":"Земли под объектами торговли, общественного питания, бытового обслуживания, автозаправочными и газонаполнительными станциями, предприятиями автосервиса","014002003000":"Земли учреждений и организаций народного образования, земли под объектами здравоохранения и социального обеспечения физической культуры и спорта, культуры и искусства, религиозными объектами","014002004000":"Земли под административно-управлен-ческими и общественными объектами, земли предприятий, организаций, учреждений финансирования, кредитования, страхования и пенсионного обеспечения","014002005000":"Земли под зданиями (строениями) рекреации","014003000000":"Земли под объектами промышленности","014004000000":"Земли общего пользования (геонимы в поселениях)","014005000000":"Земли под объектами транспорта, связи, инженерных коммуникаций","014005001000":"Под объектами железнодорожного транспорта","014005002000":"Под объектами автомобильного транспорта","014005003000":"Под объектами морского, внутреннего водного транспорта","014005004000":"Под объектами воздушного транспорта","014005005000":"Под объектами иного транспорта, связи, инженерных коммуникаций","014006000000":"Земли сельскохозяйственного использования","014006001000":"Земли под крестьянскими (фермерскими) хозяйствами","014006002000":"Земли под предприятиями, занимающимися сельскохозяйственным производством","014006003000":"Земли под садоводческими объединениями и индивидуальными садоводами","014006004000":"Земли под огородническими объединениями и индивидуальными огородниками","014006005000":"Земли под дачными объединениями","014006006000":"Земли под личными подсобными хозяйствами","014006007000":"Земли под служебными наделами","014006008000":"Земли оленьих пастбищ","014006009000":"Для других сельскохозяйственных целей","014007000000":"Земли под лесами в поселениях (в том числе городскими лесами), под древесно-кустарниковой растительностью, не входящей в лесной фонд (в том числе лесопарками, парками, скверами, бульварами)","014008000000":"Земли, занятые водными объектами, земли водоохранных зон водных объектов, а также земли, выделяемые для установления полос отвода и зон охраны водозаборов, гидротехнических сооружений и иных водохозяйственных сооружений, объектов.","014009000000":"Земли под военными и иными режимными объектами","014010000000":"Земли под объектами иного специального назначения","014011000000":"Земли, не вовлеченные в градостроительную или иную деятельность (земли – резерв)","014012000000":"Неопределено","014013000000":"Значение отсутствует"};
//=====================================================================//

var cadastre =  function(container){
	cadastreLayerSearch = gmxAPI.map.addObject();
	var map = gmxAPI.map;
	var cadastreLegend;

	var fnRefreshMap = function(){
		cadastreLegend.style.display = (rbNo.checked)?('none'):('');

		var mapExtent = map.getVisibleExtent();
		var queryString = "&bbox="+merc_x(mapExtent.minX)+"%2C"+merc_y(mapExtent.minY)+"%2C"+merc_x(mapExtent.maxX)+"%2C"+merc_y(mapExtent.maxY)+"&bboxSR=3395&imageSR=3395&size=" + +map.width()+","+map.height() + "&f=image";
		var tUrl = cadastreServer+"CadastreNew/Thematic/MapServer/export?dpi=96&transparent=true&format=png32"+queryString;
		if (cbDivision.checked){
			var sUrl = cadastreServer+"CadastreNew/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32"+queryString;
			cadastreLayer.setImageExtent({url:sUrl, extent: mapExtent, noCache: true});
			//cadastreLegend.innerHTML = 'Кадастровые сведения</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAACRQTFRF/v///v7+////////5gAA6VhY8amp87u79svL+Nra+ufn/fPzbT1i2gAAAAx0Uk5TAP//////////////CcRQJgAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAElJREFUKJHt0jESwCAIRFEIiCL3v29SogOOiW1++zoW6MJhYpDIY5AJ8wlVHaqO9EIXqScEF/70hSg97zRK25vyJZXVs1lsRewGZtsJDm3zFo0AAAAASUVORK5CYII="></td><td><span>Кадастровые округа</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAACRQTFRF/v//////////////5gAA6VhY7Ht77pSU8amp9svL+ufn////TwQsdgAAAAx0Uk5TAP//////////////CcRQJgAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAExJREFUKJHt0jESgEAIQ9G4gAvk/ve109kdGDsrf/vKBAejKjnAqWVGRC2q8UbTt+wmpyzRHxIsyU9fUT+K9VM2B8iOErRaTmK0F70ANygKXZpOPcIAAAAASUVORK5CYII="></td><td><span>Кадастровые районы</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAACpQTFRF/v///v///v///v///v///v7+/v7+////5gAA6VhY7pSU8amp87u7////w4W10AAAAA50Uk5TAP////////////////9XStsUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAW0lEQVQoke2SOxaAIAwEE5GQ7/2vK8/CBxJaK6edYosdOChSCIHCNMGDIIxTPCCUWRaY9VayLsmjapmogyowUX71lXqdcg5qe+U2AM+zsdZj8yw267FhnmgjvAB2phHJ+R544QAAAABJRU5ErkJggg=="></td><td><span>Кадастровые кварталы</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABVQTFRF/v//+/Pz+ufn8ru78Kqq7ZSU6VhYaBHp5QAAAAd0Uk5TAP///////6V/pvsAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAvSURBVCiRY2AgEzCzYQEsYCk2JkYMwMQGkWLENIlxVGq4SeFOACzYkg0rpknEAQAWXwJBzbWO4wAAAABJRU5ErkJggg=="></td><td><span>Земельные участки</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8ru78Kqq7ZSU6VhY+nJy/Xp6/39/wKq0QwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Объекты капитального строительства</span></td></tr></tbody></table';
		}
		if(rbCostLayer.checked){
			tUrl+="&layers=show:1,7";
			costLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Кадастровая стоимость</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9fUA9usA9+EAPCcsfQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>до 3 млн руб.</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9bgA9rEA96kAxLzpJgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>3 - 15 млн. руб.</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9XsA9ngA93UA+R2pSwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>15 - 30 млн. руб.</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9T0A9kAA90IAF7kxUgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>30 - 100 млн.руб.</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9QAA9hIA9yQAeAUndAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>свыше 100 млн. руб.</span></td></tr></tbody></table';
		}
		if(rbCostByAreaLayer.checked){
			tUrl+="&layers=show:0,6";
			costByAreaLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Кадастровая стоимость ЗУ за кв. м</br><table cellspacing="0" cellpadding="0" style="width: 203px;"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9fUA9usA9+EAPCcsfQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><table width="95%"><tbody><tr><td align="">до 100 руб за кв. м</td></tr></tbody></table></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9bgA9rEA96kAxLzpJgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><table width="95%"><tbody><tr><td align="">от 101 до 1000 руб. за кв. м</td></tr></tbody></table></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9XsA9ngA93UA+R2pSwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><table width="95%"><tbody><tr><td align="">от 1001 до 5000 руб. за кв. м</td></tr></tbody></table></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9T0A9kAA90IAF7kxUgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><table width="95%"><tbody><tr><td align="">от 5001 до 50000 руб. за кв. м</td></tr></tbody></table></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY9QAA9hIA9yQAeAUndAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><table width="95%"><tbody><tr><td align="">более 500000 руб. за кв. м</td></tr></tbody></table></td></tr></tbody></table>';
		}
		if(rbUseType.checked){
			tUrl+="&layers=show:2,4";
			useTypeLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Разрешенные виды использования ЗУ</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/wAA/xIA/yQAxDetmgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли с более чем одним видом использования</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/9if/+Kn/+ywWIVZzQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли жилой застройки</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/8Jy/8t6/9N/nGNq1QAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли под жилыми домами многоэтажной и повышенной этажности застройки</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/50A/6MA/6kA0zjLGAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли под домами индивидуальной жилой застройкой</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY5pkA6ZMA7I4A5xrHhAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Незанятые земли, отведенные под жилую застройку</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/+ms//S1//++G44kQgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли общественно-деловой застройки</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/+ln//Ru//90X3D6BQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли гаражей и автостоянок</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/+kA//QA//8AnfC9ewAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли под объектами торговли, общественного питания, бытового обслуживания, автозаправочными и газонаполнительными станциями, предприятиями автосервиса</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY5uYA6d0A7NMAeryBiQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли учреждений и организаций народного образования, земли под объектами здравоохранения и социального обеспечения физической культуры и спорта, культуры и искусства, религиозными объектами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYqKgAtKIAvZwAgfbyuQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под административно-управленческими и общественными объектами, земли предприятий, организаций, учреждений финансирования, кредитования, страхования и пенсионного обеспечения</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYdHQAinEAnW4AzJWFTAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под зданиями (строениями) рекреации</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY5pkA6ZMA7I4A5xrHhAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под объектами промышленности</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYqG8AtGwAvWoA5VasFgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли общего пользования (геонимы в поселениях)</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY4eHh5NjX58/MBsJpUwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под объектами транспорта, связи, инженерных коммуникаций</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYzc3N0sXD2Ly5WqFGdQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Под объектами железнодорожного транспорта</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYs7OzvKyqxaWhGy20FAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Под объектами автомобильного транспорта</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYnZ2dqpiWtpKN7dt9hwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Под объектами морского, внутреннего водного транспорта</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYgoKClX98pnt2xUDwLQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Под объектами воздушного транспорта</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYZ2dngmZjl2RdEF9uXAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Под объектами иного транспорта, связи, инженерных коммуникаций</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY0/++2fS13emsMMNQhAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли сельскохозяйственного использования</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYo/90sPRuu+lnNk+fNAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под крестьянскими (фермерскими) хозяйствами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYVf8AdvQAjukAJrp/BQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под предприятиями, занимающимися сельскохозяйственным производством</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYTeYAcd0AitMAoSK+BAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под садоводческими объединениями и индивидуальными садоводами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYN6gAZqIAhJwA4JYcbQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под огородническими объединениями и индивидуальными огородниками</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYJHQAYHEAf24Ao374EAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под дачными объединениями</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYtdefvs6XxsWPI51NXAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под личными подсобными хозяйствами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYpfV7set1u+FuPSy7WwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под служебными наделами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYiM5mmsZhqb1bRGITZwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли оленьих пастбищ</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYW4hFeoVCkYA9J56HwAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Для других сельскохозяйственных целей</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYTXQAcXEAim4AKDuv6gAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под лесами в поселениях (в том числе городскими лесами), под древесно-кустарниковой растительностью, не входящей в лесной фонд (в том числе лесопарками, парками, скверами, бульварами)</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYAMX/WL3ze7Xn/71NNgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли, занятые водными объектами, земли водоохранных зон водных объектов, а также земли, выделяемые для установления полос отвода и зон охраны водозаборов, гидротехнических сооружений и иных водохозяйственных сооружений, объектов.</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAAC1QTFRF/v///vTz2dra5tva2c3L/sO7/rSqlJSUqJaU/6KUlH58lF9Y/3ZYAAAAeyQA0xTD0AAAAA90Uk5TAP//////////////////5Y2epgAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAHdJREFUKJGd0ksOgCAQA9DhIyAi9z+uiTYyZVjRVZMXFg0jspmjLZJealdwX2pBib19FPA8ZxR/R5Az4h2RFiEiIWLRNImiWQYZ+akakQIqRnLlyUoyT9bCk0mIWDRNomiWQUZ+ikYkgHrEv5eKEnAAaXU2p2zmAUZoBsjYet62AAAAAElFTkSuQmCC"></td><td><span>Земли, не вовлеченные в градостроительную или иную деятельность (земли &ndash; резерв)</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYlUu6pE2ysU2ogM8VNAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под военными и иными режимными объектами</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZYx00zzk0w008r5GEnuAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли под объектами иного специального назначения</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/+nn//Tz////4iZzJgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Неопределено</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v///sO7/rSq/6KU/3ZY/+nn//Tz////4iZzJgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Значение отсутствует</span></td></tr></tbody></table>';
		}
		if(rbCategory.checked){
			tUrl+="&layers=show:3,5";
			categoryLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Категории земель ЗУ</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYAG//TWzza2rnJL3s7wAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли водного фонда</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYtGokuWkkvWYfu6YNWgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли запаса</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYVf8AbvQAgekA3+ZdMgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли лесного фонда</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYJHQAVnEAcW4AZkbUVgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли особо охраняемых территорий и объектов</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZY+Z0A/KMA/6kAOzMlwAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли поселений (земли населенных пунктов)</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYdE0AhU0Akk8AWdadagAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Земли промышленности, энергетики, транспорта, связи, радиовещания, телевидения, информатики, земли для обеспечения космической деятельности, земли обороны, безопасности и земли иного специального назначения</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZY6Oms6PS16f++yNID5wAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>Земли сельскохозяйственного назначения</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//8MO77bSq6qKU5HZYs7OzuKyqvaWhx9sqFgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>Категория не установлена</span></td></tr></tbody></table>';
		}		
		if(rbMapUpdate.checked){
			tUrl+="&layers=show:8";
			mapUpdateLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Актуальность сведений</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWFN6gAQKMfR58wW5lrlgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFnY2DMDOApFiY8UAbKNSw00KdwJgwpZsmMlNhADmvglpoglhjgAAAABJRU5ErkJggg=="></td><td><span>менее 1 недели</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWFh8IwiMofi9EAQ7oGzAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>1 - 2 недели</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWFv9wwxuUfzu4A5y7xwQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>2 недели - 1 месяц</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF674w9cYf/80AxdGebAAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>1 - 3 месяца</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF63ww9X4f/38ACxZRyQAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>3 месяца - 1 год</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF6zAw9R8f/wAAedG9rwAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>более 1 года</span></td></tr></tbody></table>';
		}
		if(rbMapVisitors.checked){
			tUrl+="&layers=show:9";
			mapVisitorsLayer.setImageExtent({url:tUrl, extent: mapExtent, noCache: true});
			cadastreLegend.innerHTML = 'Общее количество посещений</br><table cellspacing="0" cellpadding="0"><tbody><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF676+9cbG/83No3FH3QAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>менее 100 000</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF656U9aOZ/6eccAhG3wAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>100 000 - 500 000</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF6YBu84Ju/YVuMQ3iHgAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>500 000 - 1 000 000</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF4mNR7GFL9WBHhZwXygAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>1 000 000 - 5 000 000</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWF10k94EUw6D0k9XeHogAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>5 000 000 - 10 000 000</span></td></tr><tr><td class=cadastreLegendImageColumn><img class=cadastreLegendImage border="0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAAXNSR0IB2cksfwAAABhQTFRF/v//x8fHubq6qaqqhIWFzDAw1B8f3AAAabp87wAAAAh0Uk5TAP/////////VylQyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQokWNgIBMwsmABTGApFlY2DMDKApFiY8cAbKNSw00KdwJgwpZsmMlNhABUegvpjanC7gAAAABJRU5ErkJggg=="></td><td><span>более 10 000 000</span></td></tr></tbody></table>';
		}

		cadastreLayer.setVisible(cbDivision.checked);
		costLayer.setVisible(rbCostLayer.checked);
		costByAreaLayer.setVisible(rbCostByAreaLayer.checked);
		useTypeLayer.setVisible(rbUseType.checked);
		categoryLayer.setVisible(rbCategory.checked);
		mapUpdateLayer.setVisible(rbMapUpdate.checked);
		mapVisitorsLayer.setVisible(rbMapVisitors.checked);
	}

	var	div = _div(null, [['dir', 'className', 'cadastreLeftMenuContainer']]);

	var trs = [];		
	cbDivision = _checkbox(false, 'checkbox');
	cbDivision.onclick = fnRefreshMap;
	trs.push(_tr([_td([cbDivision]), _td([_span([_t("Кадастровое деление")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));
	
	rbNo = _radio([['attr', 'name', 'Zones'], ['attr', 'checked', 'true']]);
	rbNo.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbNo]), _td([_span([_t("Нет тематической карты")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));
	
	rbCostLayer = _radio([['attr', 'name', 'Zones']]);
	rbCostLayer.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCostLayer]), _td([_span([_t("Кадастровая стоимость")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));
	
	rbCostByAreaLayer = _radio([['attr', 'name', 'Zones']]);
	rbCostByAreaLayer.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCostByAreaLayer]), _td([_span([_t("Кадастровая стоимость за метр")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));
	
	rbUseType = _radio([['attr', 'name', 'Zones']]);
	rbUseType.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbUseType]), _td([_span([_t("Виды разрешенного использования")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));
	
	rbCategory = _radio([['attr', 'name', 'Zones']]);
	rbCategory.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbCategory]), _td([_span([_t("Категории земель")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));

	rbMapUpdate = _radio([['attr', 'name', 'Zones']]);
	rbMapUpdate.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbMapUpdate]), _td([_span([_t("Актуальность сведений")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));

	rbMapVisitors = _radio([['attr', 'name', 'Zones']]);
	rbMapVisitors.onclick = fnRefreshMap;
	trs.push(_tr([_td([rbMapVisitors]), _td([_span([_t("Общее количество посещений")],[['dir', 'className', 'cadastreLeftMenuLabel']])])], [['dir', 'className', 'cadastreLeftMenuRow']]));

	trs.push(_tr([_td([],[['attr','height',15]])]));
	trs.push(_tr([_td([_span([_t("Поиск по кадастровому номеру")],[['dir', 'className', 'cadastreLeftMenuLabel']])],[['attr','colspan',2]])]));
	
	this.mapObject = gmxAPI.map.addObject();
	this.mapObject.setCopyright('<a href="http://rosreestr.ru">© Росреестр</a>')
	cadastreLayer = this.mapObject.addObject();
	costLayer = this.mapObject.addObject();
	costByAreaLayer = this.mapObject.addObject();
	useTypeLayer = this.mapObject.addObject();
	categoryLayer = this.mapObject.addObject();
	mapUpdateLayer = this.mapObject.addObject();
	mapVisitorsLayer = this.mapObject.addObject();
	

	var iListenerID = -1;
	
	this.enableLayer = function(layerName){
		if(layerName == 'Division'){
			cbDivision.checked = true;
		}else if(layerName == 'Cost'){
			rbCostLayer.checked = true;
		}else if(layerName == 'CostByArea'){
			rbCostByAreaLayer.checked = true;
		}else if(layerName == 'UseType'){
			rbUseType.checked = true;
		}else if(layerName == 'Category'){
			rbCategory.checked = true;
		} 
		fnRefreshMap();
	}
	
	this.load = function(){
		cadastreLayer.setVisible(cbDivision.checked);
		costLayer.setVisible(rbCostLayer.checked);
		costByAreaLayer.setVisible(rbCostByAreaLayer.checked);
		useTypeLayer.setVisible(rbUseType.checked);
		categoryLayer.setVisible(rbCategory.checked);
		mapUpdateLayer.setVisible(rbMapUpdate.checked);
		mapVisitorsLayer.setVisible(rbMapVisitors.checked);

		iListenerID = gmxAPI.map.addListener("onMoveEnd", fnRefreshMap);
		
		fnRefreshMap();
	}

	function checkCadastreNumber(searchedText){
		var numberParts = searchedText.split(":");
		var re = /^[0-9]*$/;
		var cadastreNumber;
		if(numberParts.length==4 && re.test(numberParts[0]) && re.test(numberParts[1]) && re.test(numberParts[2]) && re.test(numberParts[3]))
			cadastreNumber=searchedText;
		else
			cadastreNumber='';
		return cadastreNumber;
	}

	function cadastreSearch(){
		
		function cadastreSearchBalloon(data){
			if(balloonInfo)
				balloonInfo.setVisible(false);
			if(cadastreLayerInfo)
				cadastreLayerInfo.setVisible(false);

			var html="<div style='width:300px; height:300px; overflow-x: hidden; overflow-y: scroll;'>";
			balloonSearch = map.addBalloon();
			balloonSearch.setPoint(map.getX(), map.getY());
			
			balloonSearch.setVisible(false);
			function parseDate(milliseconds){
				var date = new Date(milliseconds);
				var theyear=date.getFullYear();
				var themonth=date.getMonth()+1;
				var thetoday=date.getDate();
				var parseString=thetoday+"."+themonth+"."+theyear;

				return parseString;
			}
			html+="<h3>"+"Кадастровые участки"+"</h3><br><div><table style='text-align:left'>";
			html+="<tr><th>Статус: </th><td>"+PARCEL_STATES[parseInt(data["PARCEL_STATUS"])-1]+"</td></tr>";
			html+="<tr><th>Адрес: </th><td>"+data["OBJECT_ADDRESS"]+"</td></tr>";
			html+="<tr><th>Декларированная площадь: </th><td>"+data["AREA_VALUE"]+UNITS[data["AREA_UNIT"]]+"</td></tr>";
			html+="<tr><th>Кадастровая стоимость: </th><td>"+data["CAD_COST"]+UNITS[data["CAD_UNIT"]]+"</td></tr>";
			html+="<tr><th>Форма собственности: </th><td>"+data["RC_TYPE"]+"</td></tr>";
			html+="<tr><th>Дата постановки на учет: </th><td>"+parseDate(data["DATE_CREATE"])+"</td></tr>";
			//html+="<tr><th>Кадастровый инженер: </th><td>"+parseDate(data["DATE_CREATE"])+"</td></tr>"; TODO:
			var Num = data["PARCEL_CN"].substr(0,data["PARCEL_CN"].lastIndexOf(":"));
			html+="<tr><th>Квартал: </th><td>"+Num+"</td></tr>";
			Num = Num.substr(0,Num.lastIndexOf(":"));
			html+="<tr><th>Район: </th><td>"+Num+"</td></tr>";
			Num = Num.substr(0,Num.lastIndexOf(":"));
			html+="<tr><th>Округ: </th><td>"+Num+"</td></tr>";
			html+="<tr><th>Дата обновления сведений ПКК: </th><td>"+parseDate(data["ACTUAL_DATE"])+"</td></tr>";
			html+="<tr><th>Категория: </th><td>"+CATEGORY_TYPES[data["CATEGORY_TYPE"]]+"</td></tr>";
			html+="<tr><th>Разрешенное использование </th><td></td></tr>";
			html+="<tr><th>По классификатору (код): </th><td>"+data["UTIL_CODE"]+"</td></tr>";
			html+="<tr><th>По классификатору (описание): </th><td>"+UTILIZATIONS[data["UTIL_CODE"]]+"</td></tr>";
			html+="<tr><th>По документу: </th><td>"+data["UTIL_BY_DOC"]+"</td></tr>";
			html+="</table><br>";
			html+='<a target="_blank" href="https://rosreestr.ru/wps/portal/cc_information_online?KN='+data["PARCEL_CN"]+'">Справочная информация об объекте недвижимости</a><br>';
			html+='<a target="_blank" href="https://rosreestr.ru/wps/portal/cc_gkn_form_new?KN='+data["PARCEL_CN"]+'&objKind=002001001000">Запрос о предоставлении сведений ГКН</a><br>';
			html+='<a target="_blank" href="https://rosreestr.ru/wps/portal/cc_egrp_form_new?KN='+data["PARCEL_CN"]+'&objKind=002001001000">Запрос о предоставлении сведений ЕГРП</a><br>';
			html+="</div>";
			balloonSearch.div.innerHTML=html;
			balloonSearch.setVisible(true);
			balloonSearch.resize();
		}

		if (inputField.value != ''){
			var cadastreNumber=checkCadastreNumber(inputField.value);
			if(cadastreNumber){
				$.getJSON(cadastreServer + 'CadastreNew/Cadastre/MapServer/exts/GKNServiceExtension/online/parcel/find',{
					cadNum: cadastreNumber,//61:6:10104:2 66:41:0402004:16
					onlyAttributes:'false',
					returnGeometry:'true',
					f:'json',
					async: false
				},function(data) {
					var findInfo=data.features[0].attributes;
					var parcelId = data.features[0].attributes.PARCEL_ID;
					if(parcelId==null)
						parcelId='%20';					
					
					if(data.features[0].attributes.ERRORCODE!=1){
						var str = '%7B%222%22%3A%22PARCEL_ID%20LIKE%20%27'+parcelId+'%27%22%2C%223%22%3A%22PARCEL_ID%20LIKE%20%27'+parcelId+'%27%22%2C%224%22%3A%22PARCEL_ID%20LIKE%20%27'+parcelId+'%27%22%7D';

						$.getJSON(cadastreServer+'Geometry/GeometryServer/project',{
							inSR:'102100',
							outSR:'4326',
							geometries:'{"geometryType":"esriGeometryPoint","geometries":[{"x":'+data.features[0].attributes.XMIN+',"y":'+data.features[0].attributes.YMIN+'},{"x":'+data.features[0].attributes.XMAX+',"y":'+data.features[0].attributes.YMAX+'}]}',
							f:'pjson'
						},function(data){
							var minX = data.geometries[0].x;
							var minY = data.geometries[0].y;
							var maxX = data.geometries[1].x;
							var maxY = data.geometries[1].y;
							map.zoomToExtent(minX,minY,maxX,maxY);

							setTimeout(function(){
								var bbox = gmxAPI.map.getVisibleExtent().minX+','+gmxAPI.map.getVisibleExtent().minY+','+gmxAPI.map.getVisibleExtent().maxX+','+gmxAPI.map.getVisibleExtent().maxY;
								var url=cadastreServer+"CadastreNew/CadastreSelected/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:2,3,4&bboxSR=4326&imageSR=3395&size="+map.width()+","+map.height()+"&layerDefs="+str+"&f=image"+"&bbox="+bbox;
								cadastreLayerSearch.setImageExtent({url:url, extent: map.getVisibleExtent(), noCache: true});
								cadastreLayerSearch.setVisible(true);
								if(!balloonSearch || !balloonSearch.isVisible){
									cadastreSearchBalloon(findInfo);
								}
								else{
									balloonSearch.remove();
									balloonSearch = false;
									cadastreSearchBalloon(findInfo);
								}
							},300);
							
							
						});
					}else{
						$.getJSON(cadastreServer+'Geometry/GeometryServer/project',{
							inSR:'102100',
							outSR:'4326',
							geometries:'{"geometryType":"esriGeometryPoint","geometries":[{"x":'+data.features[0].attributes.XMIN+',"y":'+data.features[0].attributes.YMIN+'},{"x":'+data.features[0].attributes.XMAX+',"y":'+data.features[0].attributes.YMAX+'}]}',
							f:'pjson'
						},function(data){
							var minX = data.geometries[0].x;
							var minY = data.geometries[0].y;
							var maxX = data.geometries[1].x;
							var maxY = data.geometries[1].y;
							map.zoomToExtent(minX,minY,maxX,maxY);

							if(!balloonSearch|| !balloonSearch.isVisible){
								cadastreSearchBalloon(findInfo);
							}
							else{
								balloonSearch.remove();
								balloonSearch = false;
								cadastreSearchBalloon(findInfo);
							}
						});
					}
				});	
			}else
				console.log("Кадастровый номер не валиден");
		}
		else
			inputError(inputField);
	}
	//==============================================
	var inputField = _input(null, [['dir','className','inputStyle'],['css','width','200px'],['attr','value','66:41:0402004:16']]);

	inputField.onkeydown = function(e){
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			cadastreSearch();
	  		return false;
	  	}
	}

	var goButton = makeButton(_gtxt("Найти")),
		_this = this;

	goButton.onclick = cadastreSearch;

	trs.push(_tr([_td([inputField],[['attr','colspan',2]]),_td([goButton])]));

	var cadastreLegend = _div();
	_(div, [_table([_tbody(trs)]), cadastreLegend]);
	_(container, [div]);

	this.unloadCadastre = function(){
		//gmxAPI.map.handlers={}; .. не отрабатывает в leaflet версии
		if(mapListenerInfo)
			map.removeListener('onClick', mapListenerInfo);
		if(cadastreLayerListener)
			map.removeListener("onMoveEnd",cadastreLayerListener);
		if(cadastreLayerInfo)
			cadastreLayerInfo.remove();
		if(balloonInfo){
			balloonInfo.remove();
			balloonInfo = false;
		}
		if(balloonSearch){
			balloonSearch.remove();
			balloonSearch = false;
		}
		if(cadastreLayerSearch)
			cadastreLayerSearch.setVisible(false);
		inputField.value = '';
		gmxAPI._tools.standart.selectTool('move');
		gmxAPI._tools.standart.removeTool("cadastreInfo");
	}
}

var checkCadastre;
var cadastreMenu = new leftMenu();

var unloadCadastre = function(){
	if(checkCadastre != null) checkCadastre.unloadCadastre();
}

var loadCadastre = function(){
	addCadastreInfoTool();
	gmxAPI._tools.standart.setVisible(true);

	var alreadyLoaded = cadastreMenu.createWorkCanvas("cadastre", unloadCadastre);
	if (!alreadyLoaded){
		checkCadastre = new cadastre(cadastreMenu.workCanvas);
	}
	checkCadastre.load();

	extendJQuery();
	return checkCadastre;
}

function addCadastreInfoTool(){
	var map = gmxAPI.map;
	var cadastreTool = {
		'key': "cadastreInfo",
		'activeStyle': { },
		'regularStyle': { 'paddingLeft': '2px' },
		'regularImageUrl': gmxCore.getModulePath("cadastre")+"information.png",
		'activeImageUrl': gmxCore.getModulePath("cadastre")+"information_active.png",
		'onClick': function(){
			function createBalloonInfo(){
				if(balloonSearch)
					balloonSearch.setVisible(false);
				if(cadastreLayerSearch)
					cadastreLayerSearch.setVisible(false);

				balloonInfo = map.addBalloon();
				balloonInfo.setPoint(map.getMouseX(), map.getMouseY());
				balloonInfo.setVisible(false);
				var html="<div style='width:300px; height:300px; overflow-x: hidden; overflow-y: scroll;'>";
				$.getJSON(cadastreServer+'CadastreNew/CadastreSelected/MapServer/identify',{
					f:'json',
					geometry:'{"x":'+map.getMouseX()+',"y":'+map.getMouseY()+',"spatialReference":{"wkid":4326}}',
					tolerance:'0',
					returnGeometry:'false',
					mapExtent:'{"xmin":'+map.getVisibleExtent().minX+',"ymin":'+map.getVisibleExtent().minY+',"xmax":'+map.getVisibleExtent().maxX+',"ymax":'+map.getVisibleExtent().maxY+',"spatialReference":{"wkid":4326}}',
					imageDisplay:map.width()+','+map.height()+',96',
					geometryType:'esriGeometryPoint',
					sr:'4326',
					layers:'top'//top or all or layerId
				},function(data) {
					var str="";
					var showLayers="show:";
					data.results.forEach(function(value){
						switch (value.layerId) {
							case 20:
							case 19:
							case 18:
							case 17:
							case 16:
								html+="<h3>"+value.layerName+"</h3><br><div><table style='text-align:left'>";
								html+="<tr><th>OBJECTID</th><td>"+value.attributes["OBJECTID"]+"</td></tr>";
								html+="<tr><th>Ключ СФ</th><td>"+value.attributes["Ключ СФ"]+"</td></tr>";
								html+="<tr><th>Идентификатор</th><td>"+value.attributes["Идентификатор"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер</th><td>"+value.attributes["Кадастровый номер"]+"</td></tr>";
								html+="<tr><th>Наименование</th><td>"+value.attributes["Наименование"]+"</td></tr>";
								html+="<tr><th>Аннотация</th><td>"+value.attributes["Аннотация"]+"</td></tr>";
								html+="<tr><th>Число КР</th><td>"+value.attributes["Число КР"]+"</td></tr>";
								html+="<tr><th>Число КК</th><td>"+value.attributes["Число КК"]+"</td></tr>";
								html+="<tr><th>Число ЗУ</th><td>"+value.attributes["Число ЗУ"]+"</td></tr>";
								html+="<tr><th>ACTUAL_DATE</th><td>"+value.attributes["ACTUAL_DATE"]+"</td></tr>";
								html+="<tr><th>X центра</th><td>"+value.attributes["X центра"]+"</td></tr>";
								html+="<tr><th>Y центра</th><td>"+value.attributes["Y центра"]+"</td></tr>";
								html+="<tr><th>Экстент - X мин.</th><td>"+value.attributes["Экстент - X мин."]+"</td></tr>";
								html+="<tr><th>Экстент - X макс.</th><td>"+value.attributes["Экстент - X макс."]+"</td></tr>";
								html+="<tr><th>Экстент - Y мин.</th><td>"+value.attributes["Экстент - Y мин."]+"</td></tr>";
								html+="<tr><th>Экстент - Y макс.</th><td>"+value.attributes["Экстент - Y макс."]+"</td></tr>";
								html+="<tr><th>Объект обработан - можно удалять</th><td>"+value.attributes["Объект обработан - можно удалять"]+"</td></tr>";
								html+="<tr><th>ONLINE_ACTUAL_DATE</th><td>"+value.attributes["ONLINE_ACTUAL_DATE"]+"</td></tr>";
								html+="</table></div>";
								break
							case 14:
							case 13:
							case 12:
							case 11:
								html+="<h3>"+value.layerName+"</h3><br><div><table style='text-align:left'>";
								html+="<tr><th>OBJECTID</th><td>"+value.attributes["OBJECTID"]+"</td></tr>";
								html+="<tr><th>Ключ СФ</th><td>"+value.attributes["Ключ СФ"]+"</td></tr>";
								html+="<tr><th>Идентификатор</th><td>"+value.attributes["Идентификатор"]+"</td></tr>";
								html+="<tr><th>Идентификатор родителя</th><td>"+value.attributes["Идентификатор родителя"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер</th><td>"+value.attributes["Кадастровый номер"]+"</td></tr>";
								html+="<tr><th>Наименование</th><td>"+value.attributes["Наименование"]+"</td></tr>";
								html+="<tr><th>Аннотация</th><td>"+value.attributes["Аннотация"]+"</td></tr>";
								html+="<tr><th>Код ошибки</th><td>"+value.attributes["Код ошибки"]+"</td></tr>";												
								html+="<tr><th>Число КК</th><td>"+value.attributes["Число КК"]+"</td></tr>";
								html+="<tr><th>Число ЗУ</th><td>"+value.attributes["Число ЗУ"]+"</td></tr>";
								html+="<tr><th>Дата актуальности</th><td>"+value.attributes["Дата актуальности"]+"</td></tr>";
								html+="<tr><th>X центра</th><td>"+value.attributes["X центра"]+"</td></tr>";
								html+="<tr><th>Y центра</th><td>"+value.attributes["Y центра"]+"</td></tr>";
								html+="<tr><th>Экстент - X мин.</th><td>"+value.attributes["Экстент - X мин."]+"</td></tr>";
								html+="<tr><th>Экстент - X макс.</th><td>"+value.attributes["Экстент - X макс."]+"</td></tr>";
								html+="<tr><th>Экстент - Y мин.</th><td>"+value.attributes["Экстент - Y мин."]+"</td></tr>";
								html+="<tr><th>Экстент - Y макс.</th><td>"+value.attributes["Экстент - Y макс."]+"</td></tr>";
								html+="<tr><th>Объект обработан - можно удалять</th><td>"+value.attributes["Объект обработан - можно удалять"]+"</td></tr>";
								html+="</table></div>";
								break;
							case 10:
							case 8:
							case 7:
							case 6:
								html+="<h3>"+value.layerName+"</h3><br><div><table style='text-align:left'>";
								html+="<tr><th>OBJECTID</th><td>"+value.attributes["OBJECTID"]+"</td></tr>";
								html+="<tr><th>Ключ СФ</th><td>"+value.attributes["Ключ СФ"]+"</td></tr>";
								html+="<tr><th>Идентификатор</th><td>"+value.attributes["Идентификатор"]+"</td></tr>";
								html+="<tr><th>Текстовый идентификатор ИПГУ</th><td>"+value.attributes["Текстовый идентификатор ИПГУ"]+"</td></tr>";
								html+="<tr><th>Числовой идентификатор ИПГУ</th><td>"+value.attributes["Числовой идентификатор ИПГУ"]+"</td></tr>";
								html+="<tr><th>Идентификатор родителя</th><td>"+value.attributes["Идентификатор родителя"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер</th><td>"+value.attributes["Кадастровый номер"]+"</td></tr>";
								html+="<tr><th>Аннотация</th><td>"+value.attributes["Аннотация"]+"</td></tr>";
								html+="<tr><th>Значение кадастровой стоимости</th><td>"+value.attributes["Значение кадастровой стоимости"]+"</td></tr>";
								html+="<tr><th>Категория земель (код)</th><td>"+value.attributes["Категория земель (код)"]+"</td></tr>";
								html+="<tr><th>Вид разрешенного использования (код)</th><td>"+value.attributes["Вид разрешенного использования (код)"]+"</td></tr>";
								html+="<tr><th>Идентификатор системы координат</th><td>"+value.attributes["Идентификатор системы координат"]+"</td></tr>";
								html+="<tr><th>Код ошибки</th><td>"+value.attributes["Код ошибки"]+"</td></tr>";
								html+="<tr><th>Число ЗУ</th><td>"+value.attributes["Число ЗУ"]+"</td></tr>";
								html+="<tr><th>Дата актуальности квартала</th><td>"+value.attributes["Дата актуальности квартала"]+"</td></tr>";
								html+="<tr><th>Дата актуальности участков</th><td>"+value.attributes["Дата актуальности участков"]+"</td></tr>";
								html+="<tr><th>X центра</th><td>"+value.attributes["X центра"]+"</td></tr>";
								html+="<tr><th>Y центра</th><td>"+value.attributes["Y центра"]+"</td></tr>";
								html+="<tr><th>Экстент - X мин.</th><td>"+value.attributes["Экстент - X мин."]+"</td></tr>";
								html+="<tr><th>Экстент - X макс.</th><td>"+value.attributes["Экстент - X макс."]+"</td></tr>";
								html+="<tr><th>Экстент - Y мин.</th><td>"+value.attributes["Экстент - Y мин."]+"</td></tr>";
								html+="<tr><th>Экстент - Y макс.</th><td>"+value.attributes["Экстент - Y макс."]+"</td></tr>";
								html+="<tr><th>Объект обработан - можно удалять</th><td>"+value.attributes["Объект обработан - можно удалять"]+"</td></tr>";
								html+="</table></div>";
								break;
							case 4:
							case 3:
								html+="<h3>"+value.layerName+"</h3><br><div><table style='text-align:left'>";
								html+="<tr><th>OBJECTID</th><td>"+value.attributes["OBJECTID"]+"</td></tr>";
								html+="<tr><th>Ключ СФ</th><td>"+value.attributes["Ключ СФ"]+"</td></tr>";
								html+="<tr><th>Строковый идентификатор ИПГУ</th><td>"+value.attributes["Строковый идентификатор ИПГУ"]+"</td></tr>";
								html+="<tr><th>Идентификатор ПКК</th><td>"+value.attributes["Идентификатор ПКК"]+"</td></tr>";
								html+="<tr><th>Идентификатор родителя</th><td>"+value.attributes["Идентификатор родителя"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер земельного участка</th><td>"+value.attributes["Кадастровый номер земельного участка"]+"</td></tr>";
								html+="<tr><th>Статус земельного участка (код)</th><td>"+value.attributes["Статус земельного участка (код)"]+"</td></tr>";
								html+="<tr><th>Аннотация</th><td>"+value.attributes["Аннотация"]+"</td></tr>";
								html+="<tr><th>Значение кадастровой стоимости</th><td>"+value.attributes["Значение кадастровой стоимости"]+"</td></tr>";
								html+="<tr><th>Вид разрешенного использования (код)</th><td>"+value.attributes["Вид разрешенного использования (код)"]+"</td></tr>";
								html+="<tr><th>Категория земель (код)</th><td>"+value.attributes["Категория земель (код)"]+"</td></tr>";
								html+="<tr><th>Дата актуальности</th><td>"+value.attributes["Дата актуальности"]+"</td></tr>";
								html+="<tr><th>Код ошибки</th><td>"+value.attributes["Код ошибки"]+"</td></tr>";
								html+="<tr><th>X центра</th><td>"+value.attributes["X центра"]+"</td></tr>";
								html+="<tr><th>Y центра</th><td>"+value.attributes["Y центра"]+"</td></tr>";
								html+="<tr><th>Экстент - X мин.</th><td>"+value.attributes["Экстент - X мин."]+"</td></tr>";
								html+="<tr><th>Экстент - X макс.</th><td>"+value.attributes["Экстент - X макс."]+"</td></tr>";
								html+="<tr><th>Экстент - Y мин.</th><td>"+value.attributes["Экстент - Y мин."]+"</td></tr>";
								html+="<tr><th>Экстент - Y макс.</th><td>"+value.attributes["Экстент - Y макс."]+"</td></tr>";
								html+="<tr><th>Объект обработан - можно удалять</th><td>"+value.attributes["Объект обработан - можно удалять"]+"</td></tr>";
								html+="<tr><th>G_AREA</th><td>"+value.attributes["G_AREA"]+"</td></tr>";												
								html+="</table></div>";
								break;
							case 1:
								html+="<h3>"+value.layerName+"</h3><br><div><table style='text-align:left'>";
								html+="<tr><th>OBJECTID</th><td>"+value.attributes["OBJECTID"]+"</td></tr>";
								html+="<tr><th>Ключ СФ</th><td>"+value.attributes["Ключ СФ"]+"</td></tr>";
								html+="<tr><th>Идентификатор ОКС</th><td>"+value.attributes["Идентификатор ОКС"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер</th><td>"+value.attributes["Кадастровый номер"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер старый</th><td>"+value.attributes["Кадастровый номер старый"]+"</td></tr>";
								html+="<tr><th>Код статуса</th><td>"+value.attributes["Код статуса"]+"</td></tr>";
								html+="<tr><th>Тип ОКС</th><td>"+value.attributes["Тип ОКС"]+"</td></tr>";
								html+="<tr><th>Подпись</th><td>"+value.attributes["Подпись"]+"</td></tr>";
								html+="<tr><th>Дата обновления</th><td>"+value.attributes["Дата обновления"]+"</td></tr>";
								html+="<tr><th>Объект обработан - можно удалять</th><td>"+value.attributes["Объект обработан - можно удалять"]+"</td></tr>";
								html+="<tr><th>Идентификатор родителя</th><td>"+value.attributes["Идентификатор родителя"]+"</td></tr>";
								html+="<tr><th>Числовой идентификатор</th><td>"+value.attributes["Числовой идентификатор"]+"</td></tr>";
								html+="<tr><th>Кадастровый номер ЗУ</th><td>"+value.attributes["Кадастровый номер ЗУ"]+"</td></tr>";
								html+="<tr><th>Код ошибки</th><td>"+value.attributes["Код ошибки"]+"</td></tr>";
								html+="<tr><th>X центра</th><td>"+value.attributes["X центра"]+"</td></tr>";
								html+="<tr><th>Y центра</th><td>"+value.attributes["Y центра"]+"</td></tr>";
								html+="<tr><th>Экстент - X мин.</th><td>"+value.attributes["Экстент - X мин."]+"</td></tr>";
								html+="<tr><th>Экстент - X макс.</th><td>"+value.attributes["Экстент - X макс."]+"</td></tr>";
								html+="<tr><th>Экстент - Y мин.</th><td>"+value.attributes["Экстент - Y мин."]+"</td></tr>";
								html+="<tr><th>Экстент - Y макс.</th><td>"+value.attributes["Экстент - Y макс."]+"</td></tr>";						
								html+="</table></div>";
								break;
						}
						var cadId = data.results[0].value;
						//var cadId = data.results[0].attributes['OBJECTID'];
						
						var layerId = data.results[0].layerId;
						var layersRequire;
						if(layerId<=20 && layerId>=15)
							layersRequire=[15,16,17,18,19,20];
						else if(layerId<=14 && layerId>=9)
							layersRequire=[9,10,11,12,13,14];
						else if(layerId<=8 && layerId>=5)
							layersRequire=[5,6,7,8];
						else if(layerId<=4 && layerId>=2)
							layersRequire=[2,3,4];
						else if(layerId<=1 && layerId>=0)
							layersRequire=[1,0];

						$.each(layersRequire,function(index, value){
							str +=value+":PKK_ID%20LIKE%20'"+cadId+"'";
							
							showLayers +=value;
							if(layersRequire.length-1!=index){
								str+=";";
								showLayers+=",";
							}
						});
					});
					balloonInfo.setVisible(true);
					balloonInfo.visible=true;
					balloonInfo.div.innerHTML=html;
					balloonInfo.addListener('onClose', function(obj){
						cadastreLayerInfo.setVisible(false);
					});
					
					var url=cadastreServer+"CadastreNew/CadastreSelected/MapServer/export?dpi=96&transparent=true&format=png32&layers="+showLayers+"&bboxSR=4326&imageSR=3395&size="+map.width()+","+map.height()+"&layerDefs="+str+"&f=image";
					var urlBbox="&bbox="+map.getVisibleExtent().minX+","+map.getVisibleExtent().minY+","+map.getVisibleExtent().maxX+","+map.getVisibleExtent().maxY;
					
					cadastreLayerInfo.setImageExtent({url:url+urlBbox, extent: map.getVisibleExtent(), noCache: true});
					cadastreLayerListener = gmxAPI.map.addListener("onMoveEnd", function(){						
						cadastreLayerInfo.setImageExtent({url:url+"&bbox="+map.getVisibleExtent().minX+","+map.getVisibleExtent().minY+","+map.getVisibleExtent().maxX+","+map.getVisibleExtent().maxY, extent: map.getVisibleExtent(), noCache: true});
					});
					cadastreLayerInfo.setVisible(true);
				});
				balloonInfo.resize();
		}
			cadastreLayerInfo = map.addObject();
			mapListenerInfo = map.addListener("onClick",function(){
				if(!balloonInfo || !balloonInfo.isVisible){
					createBalloonInfo();
				}
				else{
					balloonInfo.remove();
					balloonInfo = false;
					createBalloonInfo();
				}
			});
		},
		'onCancel': function(){
			//map.setHandlers({"onClick": null}); .. не отрабатывается в leaflet версии
			gmxAPI._tools.standart.selectTool("move");
			if(mapListenerInfo)
				map.removeListener("onClick", mapListenerInfo);
			if(cadastreLayerListener)
				map.removeListener("onMoveEnd", cadastreLayerListener);
			if(cadastreLayerInfo)
				cadastreLayerInfo.remove();
			if(balloonInfo){
				balloonInfo.remove();
				balloonInfo = false;
			}
			//TODO: Убрать с карты балун
		},
		'hint': gmxAPI.KOSMOSNIMKI_LOCALIZED("Информация о КУ", "Cadastre information")
	};

	if(!gmxAPI._tools.standart.getToolByName("cadastreInfo"))
		gmxAPI._tools.standart.addTool( 'cadastreInfo', cadastreTool);
	console.log("add cadastreTool");

};

var publicInterface = {
	pluginName: 'Cadastre',
	Cadastre: cadastre,
	loadCadastre: loadCadastre,
	afterViewer: function(params){
		params = params || {};
		cadastreServer = params.cadastreProxy || '';
		cadastreServer += params.cadastreServer || "http://maps.rosreestr.ru/arcgis/rest/services/";

		if(params.UIMode=="lite"){
			console.log("on lite mode");

			_map = gmxAPI.map || globalFlashMap;
			if (!_map) return;

			var cadastreTools = new gmxAPI._ToolsContainer('cadastre');
			var liteCadastreLayer = _map.addObject();
			var mapListener;

			var loadCadastreLayer = function(){
				var mapExtent = _map.getVisibleExtent();
				var queryString = "&bbox="+merc_x(mapExtent.minX)+"%2C"+merc_y(mapExtent.minY)+"%2C"+merc_x(mapExtent.maxX)+"%2C"+merc_y(mapExtent.maxY)+"&bboxSR=3395&imageSR=3395&size=" +_map.width()+","+_map.height() + "&f=image";
				var sUrl = cadastreServer+"CadastreNew/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32"+queryString;	
				liteCadastreLayer.setImageExtent({url:sUrl, extent: mapExtent, noCache: true});
			}
			liteCadastreLayer.setCopyright('<a href="http://rosreestr.ru">© Росреестр</a>');

			var onCancelCadastreTools = function(){
				_map.removeListener("onMoveEnd", mapListener);
				liteCadastreLayer.setVisible(false);
				cadastreLayerInfo.setVisible(false);
				balloonInfo.remove();
			}

			var onClickCadastreTools = function(){
				loadCadastreLayer();
				mapListener = _map.addListener("onMoveEnd", loadCadastreLayer);
				liteCadastreLayer.setVisible(true);
			};
			
			var attr = {
				'onClick': onClickCadastreTools,
				'onCancel': onCancelCadastreTools,
				'onmouseover': function() { this.style.color = "orange"; },
				'onmouseout': function() { this.style.color = "wheat"; },
				'hint': "Кадастр"
			};
			cadastreTools.addTool( 'cadastre', attr);
			
			addCadastreInfoTool();//add cadastre infoButton
		}
		else
			_menuUp.addChildItem({
					id:'cadastre', 
					title:_gtxt('Кадастровые данные'),
					onsel:loadCadastre, 
					onunsel:unloadCadastre
			}, 'loadServerData');
	}
};

window.gmxCore && window.gmxCore.addModule('cadastre', publicInterface, {
    css: "cadastre.css"
});

})();

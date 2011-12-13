/** �������� �������������� ������ �����
 @class userObjects
 ������ ���������� � ������������ ������� ��������� ������, ������ �� ������� ����� ���� ���������� id.
*/
var userObjects = function()
{
	var _data = {};
    var _collectors = {};
    
    /**
	 @method
     ������������� ������, ������� ����� ����� ���� ������������ ������������ ������
    */
    this.setData = function(data)
    {
        _data = data;
    }
    
    /**
	 @method
     ���������� ��������� ������
    */
    this.getData = function()
    {
        return _data;
    }
    
	/**
	 @method
	 �������� ������ �� ���� ��������� ������. ��������� ������ �������� ����� ����� getData
	*/
    this.collect = function()
    {
        _data = {};
        for (var id in _collectors)
            if ('collect' in _collectors[id])
            {
                var data = _collectors[id].collect()
                if (data !== null)
                    _data[id] = data;
            }
    }
    
    /**
	 @method
	 �������� ����� load() � ���� ����������� ������, ��� ������� ���� ������.
	*/
    this.load = function()
    {
        for (var id in _collectors)
            if (id in _data && 'load' in _collectors[id])
                _collectors[id].load(_data[id]);
    }
    
    /**
	 @method
	 ��������� ����� ������� ������. ���� � ������ ���������� ���� �����-������ ������ ��� ����������, ��� ����� ��� ����� �� ��������
     @param collectorId {String} - ���������� ������������� �������� ������
     @param collector {Object} - ������� ������. ������ ����� ��������� ������:<br/>
         collect()->Object - ���������� ��������� ������. ���� ������ ���, ����� ������� null
         load(data)->void - ������� ������������ ������ ����������
	*/
    this.addDataCollector = function( collectorId, collector )
    {
        _collectors[collectorId] = collector;
        if (collectorId in _data)
            collector.load()
    }
}

var _userObjects = new userObjects();
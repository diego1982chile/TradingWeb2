/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * forwardtest module
 */
define(['ojs/ojcore','knockout',
        'ojs/ojresponsiveutils', 
        'ojs/ojresponsiveknockoututils',
        'ojs/ojarraydataprovider',
        'ojs/ojconverter-number','ojs/ojchart','ojs/ojformlayout'], 
    
function (oj, ko, responsiveUtils, responsiveKnockoutUtils, ArrayDataProvider, NumberConverter) {
    /**
     * The view model for the main content view template
     */        
    function forwardtestContentViewModel(params) {                  
        
        var self = this;
           
        self.isSmall = responsiveKnockoutUtils.createMediaQueryObservable(
        responsiveUtils.getFrameworkQuery(responsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY));
        self.isLargeOrUp = responsiveKnockoutUtils.createMediaQueryObservable(
        responsiveUtils.getFrameworkQuery(responsiveUtils.FRAMEWORK_QUERY_KEY.LG_UP));

        // For small screens: 1 column and labels top
        // For medium screens: 1 columns and labels inline
        // For large screens or bigger: 2 columns and labels inline
        self.columns = ko.computed(function () {
          return self.isLargeOrUp() ? 2 : 1;
        }, self);
        self.labelEdge = ko.computed(function () {
          return self.isSmall() ? 'top' : 'start';
        }, self);
        
        self.name = ko.observable();
        
        /* Variables */
        self.id = 1;
        
        self.start = ko.observable();
        self.end = ko.observable();
        self.numberOfTrades = ko.observable();
        self.profitableTradesRatio = ko.observable();
        self.rewardRiskRatio = ko.observable();
        self.vsBuyAndHoldRatio = ko.observable();
        self.cashFlow = ko.observable();        
                
        self.dataProvider = ko.observable();
        
        self.trendColor = ko.observable('');
        self.ledRotation = ko.observable(0);
        self.currentText = ko.observable('');
        self.percentChange = ko.observable('');
        
        /**
        * Update the stock change label and gauge
        * @param {Number} startTime The start time
        * @param {Number} endTime The end time
        */
        self.updateStockChangeLabel = function (startTime, endTime) {
          
          var currentText = "";

          if (startTime) {
            var date = new Date(startTime)
            currentText += '' + date.getDate() + " " + date.toString().split(' ')[1] + " " + date.getFullYear();
          }
          if (endTime) {
            var date = new Date(endTime)
            currentText += ' - ' + date.getDate() + " " + date.toString().split(' ')[1] + " " + date.getFullYear();
          }
          self.currentText(currentText);
          
          console.log("startTime = " + startTime);
          console.log("endTime = " + endTime);
          //console.log("self.twoYearData() = " + self.twoYearData());
          
          var startIndex = self.closestGroup(self.twoYearData(), startTime);
          var endIndex = self.closestGroup(self.twoYearData(), endTime);          
          
          console.log("startIndex = " + startIndex);
          console.log("endIndex = " + endIndex);

          var startClose = self.twoYearData()[startIndex]['closePrice'];
          var endClose = self.twoYearData()[endIndex]['closePrice'];
          //var percentChange = Math.round((endClose - startClose) / startClose * 10000) / 100 + '%';
          var percentChange = 0 + '%';         
                    
          if (startClose < endClose) {
            self.ledRotation(0);
            self.trendColor('#68c182');
          }
          else {
            self.ledRotation(180);
            self.trendColor('#ed6647');
          }          
          self.percentChange(percentChange);               
                            
        }.bind(self);
        
        //March 27th 2015
        self.currentTime = ko.observable();
        self.seriesTypeValue = ko.observable('auto');
        self.yAxisConverter = ko.observable({converter: new NumberConverter.IntlNumberConverter({style: 'currency', currency: 'USD'})});
        self.viewportMinValue = ko.observable();
        
        self.twoYearData = ko.observable();                
        
        self.xAxis = ko.observable();
        
        // Use binary search to find the closest group
        self.closestGroup = function(array, x) {            
          console.log(array);          
          var low = 0;
          var hi = array.length;
          while (hi - low > 1) {
            var mid = Math.round((low + hi) / 2);
            if (array[mid].group <= x)
              low = mid;
            else
              hi = mid;
          }
          if (array[low].group === x)
            hi = low;
          
          return low;                    
        }

        self.intervalValue = ko.observable('3 Month');
        
        self.intervalValueChange = function(event) {  

            var value;

            if (event.detail.value === '1 Week')
              value = self.twoYearData[495].group;
            else if (event.detail.value === '1 Month')
              value = self.twoYearData[480].group;
            else if (event.detail.value === '3 Month')
              value = self.twoYearData[438].group;
            else
              value = self.twoYearData[0].group;          

            self.viewportMinValue(value);
            var date = new Date(value);
            console.log("this.currentTime = " + self.currentTime);
            self.updateStockChangeLabel(value, self.currentTime);

            return true;
        }.bind(self);
        
        self.viewportChange = function(event) {
          //alert("event.detail['xMin'] = " + event.detail['xMin'] + " event.detail['xMax'] = " + event.detail['xMax']);          
          self.updateStockChangeLabel(event.detail['xMin'], event.detail['xMax']);
        }.bind(self);       
        

        self.forwardtestModel = ko.computed(function () {
            
            //console.log(JSON.stringify(params));            
            if (typeof params.forwardtestModel() === 'undefined') {
                return;
            }          
            
            console.log(JSON.stringify(params.forwardtestModel()));
            
            var id = params.forwardtestModel().id;//.get('id');     
                                    
            var formatter = new Intl.DateTimeFormat("es-CL");

            $.getJSON("http://dnssemantikos:8181/TradingService/api/forwardTests/" + id).
                then(function (forwardtest) {  
                    self.name("FORWARDTEST " + forwardtest.name.replace(".csv",""));
                    
                    self.start(formatter.format(new Date(forwardtest.start.replace("Z",""))));
                    self.end(formatter.format(new Date(forwardtest.end.replace("Z",""))));
                    self.numberOfTrades(forwardtest.numberOfTrades);
                    self.profitableTradesRatio(forwardtest.profitableTradesRatio);
                    self.rewardRiskRatio(forwardtest.rewardRiskRatio);
                    self.vsBuyAndHoldRatio(forwardtest.vsBuyAndHoldRatio);
                    self.cashFlow(forwardtest.cashFlow);                                        
                    
                    self.twoYearData(forwardtest.bars);
                    //self.dataProvider = ko.observable();
                    self.dataProvider(new ArrayDataProvider(forwardtest.bars, {keyAttributes: 'id'}));   
                    
                    self.viewportMinValue(forwardtest.bars[forwardtest.bars.length-61].group);                    
                    self.currentTime(forwardtest.bars[forwardtest.bars.length-1].group);
                    
                    console.log("forwardtest.bars.length = " + forwardtest.bars.length);      
                    
                    self.updateStockChangeLabel(self.viewportMinValue(), self.currentTime());    
                                        
                    $('#backtest').hide();
                    $('#forwardtest').show();

                });               
                
                 
            return params.forwardtestModel();
        });
        
        self.xAxis = ko.computed(function() {
            console.log("self.viewportMinValue() = " + self.viewportMinValue());
            console.log("self.currentTime() = " + self.currentTime());                        
            return {viewportMin: self.viewportMinValue()};
        }.bind(self));  
                            
    }
       
    return forwardtestContentViewModel;
});

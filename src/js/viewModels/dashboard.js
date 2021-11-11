/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['knockout',                     
        'ojs/ojcollectiondataprovider',                
        'ojs/ojarraydataprovider',
        'ojs/ojarraytabledatasource',
        'ojs/ojpagingcontrol',        
        'ojs/ojinputtext','ojs/ojlistview',
        'ojs/ojlabel','ojs/ojlabelvalue','ojs/ojbutton','ojs/ojselectcombobox',
        'ojs/ojconveyorbelt'
        ],
        
 function(ko, CollectionDataProvider, ArrayDataProvider) {

    function DashboardViewModel() {        
        
        var self = this;       
          
        /*
        $('body').loadingModal({
            //text: 'Cargando...',
        });        
        */
        
        //$('body').loadingModal('animation', 'fadingCircle').loadingModal('backgroundColor', 'gray');

        self.value1 = ko.observable('CH'); 
        
        self.selectedTabItem = ko.observable();
        
        self.scrollPos = ko.observable({ y: 0 });
        self.scrollPosDetail = ko.observable();
        
        self.handleScrollPositionChanged = function (event) {
            var value = event.detail.value;
            self.scrollPosDetail('x: ' + Math.round(value.x) + ' y: ' + Math.round(value.y) + ' key: ' + value.key + ' index: ' + value.index + ' offsetX: ' + Math.round(value.offsetX) + ' offsetY: ' + Math.round(value.offsetY));
        }.bind(self);
        
        // if the contents of the array can change, then replace the [...] with ko.observableArray([...]) 
        self.timeFrames = [
          {id: '1', name: 'MINUTE'},
          {id: '2', name: 'HOUR'},
          {id: '3', name: 'DAY'},
          {id: '4', name: 'WEEK'},
          {id: '5', name: 'MONTH'}
        ];
        
        // observable bound to the Buttonset:
        self.selectedTimeFrame = ko.observable('3');

        /* Variables */        
        //self.selectedTabItem = ko.observable("settings");
        //self.backTestListDataSource = ko.observable();
        self.selectedBackTest = ko.observable();
        self.selectedBackTestModel = ko.observable();
        self.backTestList = ko.observable();
        
        self.selectedForwardTest = ko.observable();
        self.selectedForwardTestModel = ko.observable();
        self.forwardTestList = ko.observable();
        self.forwardTestListDataSource = ko.observable();
        self.selectionRequired = ko.observable(false);
        
        self.backTestListDataSource = ko.computed(function () {
           /* List View Collection and Model */
            var backTestModelItem = oj.Model.extend({
                idAttribute: 'id'
            });

            var backTestListCollection = new oj.Collection(null, {
                url: "http://dnssemantikos:8181/TradingService/api/periods/100/" + self.selectedTimeFrame(),
                model: backTestModelItem
            });                          

            self.backTestList = ko.observable(backTestListCollection);                            

            //self.backTestListDataSource(new oj.CollectionTableDataSource(self.backTestList()));   
            //return new PagingDataProviderView(new CollectionDataProvider(self.backTestList()));
            return new CollectionDataProvider(self.backTestList());
        });                              
                
        /* List selection listener */        
        self.backtestListSelectionChanged = function () {                                               
            
            self.selectionRequired(false);
                        
            self.selectedBackTestModel(self.backTestList().get(self.selectedBackTest()));                        
            
            self.forwardTestList = ko.observable(self.selectedBackTestModel().get('forwardTests'));
                        
            //if(self.forwardTestList().length > 0) {  
                //alert("hola");
                self.forwardTestListDataSource(new ArrayDataProvider(self.forwardTestList(),{ keyAttributes: 'id' }));                
            //}   
            
            
            // Check if the selected ticket exists within the tab data
            var match = ko.utils.arrayFirst(self.tabData(), function (item) {
              return item.id == self.selectedBackTest();
            });

            if (!match) { 
                while(self.tabData().length > 0) {                    
                    self.tabData.pop();
                }                
                self.tabData.push({
                  "name": self.selectedBackTest(),
                  "id": self.selectedBackTest()
                });
            }
            
            self.selectedTabItem(self.selectedBackTest());                        
        };  
        
        /* List selection listener */        
        self.forwardtestListSelectionChanged = function () {     
                        
            self.selectionRequired(true);                        
                        
            console.log("self.forwardTestList() = " + JSON.stringify(self.forwardTestList()));            
            
            self.selectedForwardTestModel(self.forwardTestList()[0]);                                  
            
            //self.selectedForwardTestModel = self.forwardTestList()[0];                                  
            
            // Check if the selected ticket exists within the tab data
            var match = ko.utils.arrayFirst(self.tabData(), function (item) {              
              return item.id == self.selectedForwardTest();
            });                        

            if (!match) {                                
                //self.tabData.pop();
                if(self.tabData().length > 1) {
                    self.tabData.pop();
                }
                self.tabData.push({
                  "name": self.selectedForwardTest(),
                  "id": self.selectedForwardTest()
                });
            }
                                    
            self.selectedTabItem(self.selectedForwardTest());                        
        };  
        
        /* Tab Component */
        self.tabData = ko.observableArray([]);
        self.tabBarDataSource = new oj.ArrayTableDataSource(self.tabData, { idAttribute: 'id' });

        self.deleteTab = function (id) {                        
            
            // Prevent the first item in the list being removed
            //if(id != self.backTestList().at(0).id){          
            if(self.tabData.length > 1) {

              var hnavlist = document.getElementById('ticket-tab-bar'),
                items = self.tabData();
              for (var i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                  self.tabData.splice(i, 1);

                 /* Check if the current selected list item matches the open tab,
                    if so, reset to the first index in the list
                  */
                  if(id === self.selectedBackTest() || self.selectedBackTest() != self.selectedTabItem()){                         
                        self.selectedTabItem(self.tabData()[0].id);
                  }

                  oj.Context.getContext(hnavlist)
                    .getBusyContext()
                    .whenReady()
                    .then(function () {
                      hnavlist.focus();
                    });
                  break;
                }
              }
            }
        };

        self.onTabRemove = function (event) {
            self.deleteTab(event.detail.key);
            event.preventDefault();
            event.stopPropagation();
        };

        self.tabSelectionChanged = function () {               
            self.selectedBackTestModel(self.backTestList().get(self.selectedTabItem()))
            //self.selectedBackTest([self.selectedTabItem()])          
        } 
        
        /*
        $( document ).ajaxStart(function() {            
            $('body').loadingModal('show');
        });
                
        
        $( document ).ajaxComplete(function() {            
            $('body').loadingModal('hide');
        });
        */
                
        
    }      

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel;
  }
);

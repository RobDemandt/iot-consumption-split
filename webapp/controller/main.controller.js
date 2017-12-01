sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"odataconsumption/model/models",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Label',
	'sap/m/MessageToast',
	'sap/m/Text',
	'sap/m/TextArea',
	'sap/ui/core/mvc/Controller',
	'sap/ui/layout/HorizontalLayout',
	'sap/ui/layout/VerticalLayout',
	'sap/ui/model/Model'
], function(Controller, JSONModel, Models, Button, Dialog, Label, MessageToast, Text, TextArea, HorizontalLayout, VerticalLayout) {
	"use strict";

	return Controller.extend("odataconsumption.controller.main", {

		/**
		 * List of numbers of values to be shown in the chart. Will be shown as radio buttons.
		 */
		SHOWN_VALUE_COUNTS: (function() {
			var shownValueCounts = [
				10,
				50,
				100,
				250,
				500
			];
			/**
			 * Converts a shownValueCounts value to its index in shownValueCounts and back. For use with
			 * 'selectedIndex' in lists or radio button groups.
			 */
			sap.ui.model.SimpleType.extend("odataconsumption.ShownValueCountToIndexConverter", {
				parseValue: function(index) {
					return shownValueCounts[index];
				},
				formatValue: function(count) {
					return shownValueCounts.indexOf(count);
				},
				validateValue: function(count) {
					return shownValueCounts.indexOf(count) !== -1;
				}
			});
			return shownValueCounts;
		})(),

		/**
		 * The update interval of the chart, if auto refresh is enabled.
		 */
		CHART_UPDATE_INTERVAL: 1000,

		_intervalId: null,
		_oViewModel: null,
		_oDeviceModel: null,
		_oDeviceTypesModel: null,
		_oDataModel: null,
		_oMeasureModel: null,
		_oChartModel: null,
		_oModelTileInput: null,
		oModel: null,
		_TileModel: null,
		testModel: null,

		/**
		 * This function is automatically called on startup
		 */
		onInit: function() {

			// Create models
			this._oViewModel = Models.createViewModel();
			this._oViewModel.setProperty('/shownValueCounts', this.SHOWN_VALUE_COUNTS);
			this._oViewModel.setProperty('/shownValueCount', this.SHOWN_VALUE_COUNTS[0]);
			this._oDataModel = Models.createODataModel();
			this._oDeviceModel = new JSONModel();
			this._oDeviceTypesModel = new JSONModel();
			this._oMeasureModel = new JSONModel();
			this._oChartModel = new JSONModel();
			this._oTileModel = new JSONModel();
			this._oModelTileInput = new JSONModel();
			this._TileModel = new sap.ui.model.json.JSONModel();
			this.oModel = new sap.ui.model.json.JSONModel();
			this.testModel = new sap.ui.model.json.JSONModel();

			// Set models to view
			this.getView().setModel(this._oViewModel, "viewModel");
			this.getView().setModel(this._oDeviceModel, "devices");
			this.getView().setModel(this._oDeviceTypesModel, "deviceTypes");
			this.getView().setModel(this._oMeasureModel, "measure");
			this.getView().setModel(this._oDataModel, "odata");
			this.getView().setModel(this._oChartModel, "chart");
			this.getView().setModel(this._oTileModel, "TileModel");
			this.getView().setModel(this.testModel, "TestModel");
			this.oModel = new sap.ui.model.json.JSONModel();

			//Setup the tiles
			this._oTileModel.loadData("./models/model.json");

			this.initChart();

			//Start the auto-update
			this.intervalId = setInterval(this.updateChartData.bind(this), this.CHART_UPDATE_INTERVAL);
			this.updateChartData();
		
			//var oTileContainer = this.getView().byId("container"); //Get hold of TileContainer
			//this._oTileModel.addEventDelegate({
			//  onAfterRendering: function() {
			//    //Get Aggregation Tiles of tile container
			//    var oTiles = this.getAggregation("tiles");
			//    //First Tile
			//    var oApproveTile = oTiles[0].getId();
			//    sap.ui.getCore().byId(oApproveTile).attachPress(
			//      function(oEvent) {
			//        var app = sap.ui.getCore().byId("mainApp");
			//        var oContext = oEvent.getSource().getBindingContext();
			//        var page = app.getPage("DetailPage");
			//        if (page === null) {
			//          page = new sap.ui.xmlview("DetailPage", "sap.ui.demo.wt.Detail");
			//          app.addPage(page);
			//        }
			//          page.setBindingContext(oContext);
			//        app.to(page, "slide", {});
			//      });

			//  }
			//}, this._oTileModel);

			// Wait until all promises are resolved and set default selection
			Models.loadRDMSModels(this._oDeviceModel, this._oDeviceTypesModel, this._oMeasureModel).then(function(mValues) {
				// Get devices
				var mDevices = mValues[0];
				if (mDevices.length > 0) {
					// Set selection to first device
					this.changeDevice(mDevices[0].id);
				}

			}.bind(this));
		},

		pressReportIssue: function(oEvent) {

			//Report popop button	
			var dialog = new Dialog({
				title: 'Send Maintenance Notification to S/4HANA',
				type: 'Message',
				content: [
					new HorizontalLayout({
						content: [
							new VerticalLayout({
								width: '120px',
								content: [
									new Text({
										text: 'Type: '
									}),
									new Text({
										text: 'Delivery:'
									}),
									new Text({
										text: 'Items count: '
									})
								]
							}),
							new VerticalLayout({
								content: [
									new Text({
										text: 'Shopping Cart'
									}),
									new Text({
										text: 'Jun 26, 2013'
									}),
									new Text({
										text: '2'
									})
								]
							})
						]
					}),
					new TextArea('confirmDialogTextarea', {
						width: '100%',
						placeholder: 'Add description (optional)'
					})
				],
				beginButton: new Button({
					text: 'Submit',
					press: function() {
						var sText = sap.ui.getCore().byId('confirmDialogTextarea').getValue();
						MessageToast.show('Maitenance notification is send in S/4HANA.');
						dialog.close();
					}
				}),
				endButton: new Button({
					text: 'Cancel',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();

		},

		pressKepesertaan: function(oEvent) {
			console.log("Press function");

			////Find which tile was pressed
			var sPath = oEvent.getSource().getBindingContext("TileModel").getPath();
			var oContext = this._oTileModel.getProperty(sPath);
			console.log(JSON.stringify(oContext['title']));

			if (oContext['title'] === "Temperature") {
				var oSelectedItems = this.getView().byId('measureSelection').setSelectedKeys("2");
			}

			if (oContext['title'] === "Humidity") {
				var oSelectedItems = this.getView().byId('measureSelection').setSelectedKeys("3");
			}

			if (oContext['title'] === "Distance") {
				var oSelectedItems = this.getView().byId('measureSelection').setSelectedKeys("4");
			}

			//if (oContext['title'] === "Tilt") {
			//	var oSelectedItems = this.getView().byId('measureSelection').setSelectedKeys("5");
			//}

			if (oContext['title'] === "X/Y") {
				var oSelectedItems = this.getView().byId('measureSelection').setSelectedKeys("6");
			}

			//Always Update the chart
			this.setChart();

		},

		/**
		 * Refesh the RDMS models and adapt the selected device, if necessary.
		 */
		onRefreshDevicesPressed: function(evt) {
			var selectedDeviceId = this._oViewModel.getProperty('/selectedDeviceId');
			Models.loadRDMSModels(this._oDeviceModel, this._oDeviceTypesModel, this._oMeasureModel).then(function(mValues) {
				// check, if the selected device is still available
				var mDevices = mValues[0];
				for (var i = 0; i < mDevices.length; i++) {
					if (mDevices[i].id === selectedDeviceId) {
						return;
					}
				}
				// if the device has been deleted, select another device
				if (mDevices.length > 0) {
					// Set selection to first device
					this.changeDevice(mDevices[0].id);
				}
			}.bind(this));
		},

		/**
		 * Eventhandler that is called when the user selects a different device
		 *
		 * @param oEvent
		 */
		onDeviceChange: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var sId = oSelectedItem.getKey();
			// Set selected device
			this.changeDevice(sId);
			// update chart
			this.setChart();
		},

		/**
		 * Eventhandler that is called when the user select a different message type
		 *
		 * @param oEvent
		 */
		onMessageTypeChange: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var sId = oSelectedItem.getKey();
			// Set selected message type
			this._oViewModel.setProperty('/selectedMessageTypeId', sId);

			this.setMeasures(sId);
			this.clearMeasureSelection();

			// update chart
			this.setChart();
		},

		/**
		 * Adapt value state of the measure selection control and redraw the chart according to the selected measures.
		 */
		onMeasureSelectionChanged: function(evt) {

			console.log(evt);
			if (evt.getSource().getSelectedItems().length === 0) {
				evt.getSource().setValueState(sap.ui.core.ValueState.Error);
			} else {
				evt.getSource().setValueState(sap.ui.core.ValueState.None);
			}
			this.setChart();
		},

		/**
		 * Set or clear the automatic chart data update.
		 */
		onAutoRefreshChanged: function(evt) {
			if (this.getView().byId('autoRefreshSwitch').getState()) {
				this.intervalId = setInterval(this.updateChartData.bind(this), this.CHART_UPDATE_INTERVAL);
				this.updateChartData();
			} else {
				if (this.intervalId) {
					clearInterval(this.intervalId);
				}
			}
		},

		/**
		 * Reload chart data to adapt to the chosen number of values to be shown.
		 */
		onShownValueCountChanged: function(evt) {
			this.updateChartData();
		},

		/**
		 * Should be called when the device ID changes
		 *
		 * @param sId the ID of a device
		 */
		changeDevice: function(sId) {
			var oDevice = this.getDeviceById(sId);
			var oDeviceType = this.getDeviceTypeById(oDevice.deviceType);

			this._oViewModel.setProperty('/messageTypes', oDeviceType.messageTypes);
			this._oViewModel.setProperty('/selectedMessageTypeId', oDeviceType.messageTypes[0].id);
			this._oViewModel.setProperty('/selectedDeviceId', oDevice.id);

			this.setMeasures(oDeviceType.messageTypes[0].id);
			this.clearMeasureSelection();
		},

		/**
		 * Clear the selected measures in the measure selection control and set value state to error.
		 */
		clearMeasureSelection: function() {
			var measureSelection = this.getView().byId('measureSelection');
			measureSelection.clearSelection();
			measureSelection.setValueState(sap.ui.core.ValueState.Error);
		},

		/**
		 * Get the deviceType by ID from the deviceType model
		 *
		 * @param sId the id of a device
		 * @returns {DeviceType}
		 */
		getDeviceTypeById: function(sId) {
			var mDeviceTypes = this._oDeviceTypesModel.getData();
			var mFilteredDeviceTypes = mDeviceTypes.filter(function(next) {
				return sId === next.id;
			});
			return mFilteredDeviceTypes[0];
		},

		/**
		 * Get the device by ID from the device model
		 *
		 * @param sId the ID of a device
		 * @returns {Device}
		 */
		getDeviceById: function(sId) {
			var mDevices = this._oDeviceModel.getData();
			var mFilteredDevices = mDevices.filter(function(next) {
				return sId === next.id;
			});
			return mFilteredDevices[0];
		},

		/**
		 * Set all message fields that can be used as measures in the chart.
		 *
		 * @param sMessageType the ID of a MessageType
		 */
		setMeasures: function(sMessageType) {
			var aMessageContent = this._oMeasureModel.getData();
			var oMessage;
			for (var i = 0; i < aMessageContent.length; i++) {
				if (sMessageType === aMessageContent[i].id) {
					oMessage = aMessageContent[i];
					break;
				}
			}
			if (oMessage) {
				// filtering the timestamp field because it will be displayed on the X-Axis
				var fields = oMessage.fields.filter(function(value) {
					return value.name !== "timestamp";
				});
				this._oViewModel.setProperty("/measures", fields);
			}
		},

		/**
		 * Initialize the chart with visualization properties and a dataset containing the timestamp dimension.
		 * The chart is initially set to invisible.
		 */
		initChart: function() {
			var oVizFrame = this.getView().byId('idVizFrame');
			oVizFrame.setVizProperties({
				plotArea: {
					window: {
						start: Date.now(),
						end: Date.now()
					},
					dataLabel: {
						formatString: "__UI5__ShortIntegerMaxFraction2",
						visible: false
					}
				},
				legend: {
					visible: true
				},
				title: {
					visible: false
				},
				timeAxis: {
					title: {
						visible: false
					},
					levels: ["day", "month", "year"],
					levelConfig: {
						month: {
							formatString: "MM"
						},
						year: {
							formatString: "yyyy"
						}
					},
					interval: {
						unit: ''
					}
				},
				valueAxis: {
					title: {
						visible: false
					}
				}
			});
			oVizFrame.setModel(this._oChartModel);

			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "timestamp",
					value: {
						path: 'G_CREATED',
						formatter: this.formatDate
					},
					dataType: "date"
				}]
			});
			oDataset.bindAggregation("data", {
				path: "/"
			});
			oVizFrame.setDataset(oDataset);
			oVizFrame.setVisible(false);
		},

		/**
		 * Reload chart data. If no measures are selected, the call is ignored.
		 */
		updateChartData: function() {

			console.log("Update chart data"+this.testModel.getProperty("/d/results/0/C_TEMPERATURE"));
			this._oTileModel.setProperty("/TileCollection/1/number", this.testModel.getProperty("/d/results/0/C_TEMPERATURE"));
			this._oTileModel.setProperty("/TileCollection/0/number", this.testModel.getProperty("/d/results/0/C_HUMIDITY"));
			this._oTileModel.setProperty("/TileCollection/2/number", this.testModel.getProperty("/d/results/0/C_DISTANCE"));
			this._oTileModel.setProperty("/TileCollection/4/number", this.testModel.getProperty("/d/results/0/C_TILT"));

			this.testModel.loadData(
				"/iotmms/v1/api/http/app.svc/SYSTEM.T_IOT_4AFD1B5B48B759BD3410?$format=json&$top=1&$orderby=G_CREATED%20desc");

			this.testModel.attachRequestCompleted(function(oEvent) {
				if (!oEvent.getParameter('success')) {
					console.log("Odata read error!");
					MessageToast.show('Connectivity error with database server (ODATA)');
				}
			});
			

			//Change the infostate for the temperatur tile
						if (this.testModel.getProperty("/d/results/0/C_TEMPERATURE") > 30) {
				(this._oTileModel.setProperty("/TileCollection/1/infoState", "Error"));
				(this._oTileModel.setProperty("/TileCollection/1/info", "Error"));
			} else {
				(this._oTileModel.setProperty("/TileCollection/1/infoState", "Success"));
				(this._oTileModel.setProperty("/TileCollection/1/info", "OK"));
			}
			//Change the infostate for the Humidity tile
			if (this.testModel.getProperty("/d/results/0/C_HUMIDITY") > 70) {
				(this._oTileModel.setProperty("/TileCollection/0/infoState", "Error"));
				(this._oTileModel.setProperty("/TileCollection/0/info", "Error"));
			} else {
				(this._oTileModel.setProperty("/TileCollection/0/infoState", "Success"));
				(this._oTileModel.setProperty("/TileCollection/0/info", "OK"));
			}

			//Change the infostate for the Distance tile
			if (this.testModel.getProperty("/d/results/0/C_DISTANCE") > 70) {
				(this._oTileModel.setProperty("/TileCollection/2/infoState", "Error"));
				(this._oTileModel.setProperty("/TileCollection/2/info", "Error"));
			} else {
				(this._oTileModel.setProperty("/TileCollection/2/infoState", "Success"));
				(this._oTileModel.setProperty("/TileCollection/2/info", "OK"));
			}

			// //Change the infostate for the Distance tile
			// if (this.testModel.getProperty("/d/results/0/C_TILT") > 70) {
			// 	(this._oTileModel.setProperty("/TileCollection/3/infoState", "Error"));
			// 	(this._oTileModel.setProperty("/TileCollection/3/info", "Error"));
			// } else {
			// 	(this._oTileModel.setProperty("/TileCollection/3/infoState", "Success"));
			// 	(this._oTileModel.setProperty("/TileCollection/3/info", "OK"));
			// }

			

			// if no measures are selected, skip loading data
			if (this.getView().byId('measureSelection').getSelectedItems().length < 1) {
				return;
			}

			var sDeviceId = this._oViewModel.getProperty('/selectedDeviceId');
			var sMessageTypeId = this._oViewModel.getProperty('/selectedMessageTypeId').toUpperCase();
			console.log(sMessageTypeId);
			var shownValueCount = this._oViewModel.getProperty('/shownValueCount');
			this._oDataModel.read("/T_IOT_" + sMessageTypeId, {
				urlParameters: {
					"$top": shownValueCount
				},
				filters: [
					new sap.ui.model.Filter("G_DEVICE", sap.ui.model.FilterOperator.EQ, sDeviceId)
				],
				sorters: [
					new sap.ui.model.Sorter("G_CREATED", true)
				],
				success: function(oData, oResponse) {
					this._oChartModel.setData(oData.results);
				}.bind(this),
				error: function(oError) {
					this._oChartModel.setData(null);
				}.bind(this)
			});
		},

		/**
		 * Set the chart to the current selected device, message type and selected measure 
		 */
		setChart: function() {
			var oVizFrame = this.getView().byId('idVizFrame');

			var oSelectedItems = this.getView().byId('measureSelection').getSelectedItems();
			if (oSelectedItems.length > 0) {
				oVizFrame.setVisible(true);
				var oDataset = oVizFrame.getDataset();
				var oPlainMeasures = [];
				for (var i in oSelectedItems) {
					oPlainMeasures[i] = oSelectedItems[i].getProperty("text");
					oDataset.addMeasure(new sap.viz.ui5.data.MeasureDefinition({
						name: oPlainMeasures[i],
						value: "{C_".concat(oPlainMeasures[i].toUpperCase(), "}")
					}));
				}

				oVizFrame.removeFeed(1);
				oVizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "primaryValues",
					"type": "Measure",
					"values": oPlainMeasures
				}));

				this.updateChartData();
			} else {
				oVizFrame.setVisible(false);
				// if no measures are selected, delete the chart data and data bindings
				this._oChartModel.setData(null);
				oVizFrame.removeFeed(1);
				oVizFrame.getDataset().removeAllMeasures();
			}
		},

		/**
		 * Formats the date object that is shown in chart
		 *
		 * @param oValue the value to be date formatted
		 * @returns {string} a date formatted string
		 */
		formatDate: function(oValue) {
			var oDate = null;
			// can be of type Date if consumed with OData (XML format)
			if (oValue instanceof Date) {
				oDate = oValue;
			}
			// can be a string primitive in JSON, but we need a number
			else if ((typeof oValue) === "string") {
				// can be of type JSON Date if consumed with OData (JSON format)
				if (oValue.indexOf("/") === 0) {
					oValue = oValue.replace(new RegExp("/", 'g'), "");
					oValue = oValue.replace(new RegExp("\\(", 'g'), "");
					oValue = oValue.replace(new RegExp("\\)", 'g'), "");
					oValue = oValue.replace("Date", "");
					oValue = parseInt(oValue);
					oDate = new Date(oValue);
				} else {
					// backward compatibility, old type was long, new type is date
					// check if not a number
					var result = isNaN(Number(oValue));
					if (result) {
						// FF and Ie cannot create Dates using 'DD-MM-YYYY HH:MM:SS.ss' format but
						// 'DD-MM-YYYYTHH:MM:SS.ss'
						oValue = oValue.replace(" ", "T");
						// this is a date type
						oDate = new Date(oValue);
					} else {
						// this is a long type
						oValue = parseInt(oValue);
						// ensure that UNIX timestamps are converted to milliseconds
						oDate = new Date(oValue * 1000);
					}
				}
			} else {
				// ensure that UNIX timestamps are converted to milliseconds
				oDate = new Date(oValue * 1000);
			}
			return oDate;
		},

		/**
		 * Formats the enablement of the select fields. If no data is found the select fields are disabled.
		 *
		 * @param oValue the data that is shown in select
		 * @returns {boolean} false if select should be disabled else true
		 */
		formatSelectEnablement: function(oValue) {
			if (oValue === null || oValue === undefined || oValue.length === 0 || jQuery.isEmptyObject(oValue)) {
				return false;
			}
			return true;
		}
	});
});
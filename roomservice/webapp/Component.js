sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "sync/c201/roomservice/model/models",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, Device, models, JSONModel) {
        "use strict";

        return UIComponent.extend("sync.c201.roomservice.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                var infoData = {
                    sPlant : null,
                    sDepNm : '고객 서비스팀',
                    sEmpNm : null
                };
                
                var selectdata = {

                    sBookid  : null,
                    sOrderid : null,
                    sRoomno  : null,
                    sFilter  : null

                };

                var countData = {

                    iCheck_fb_f : null,
                    iCheck_cs_o : null,
                    iCheck_cs_f : null,

                };

                var oModel1 = new JSONModel(infoData);
                var oModel2 = new JSONModel();
                var oModel3 = new JSONModel(selectdata);
                var oModel4 = new JSONModel(countData);

                this.setModel(oModel1, "InfoData");          // Selection View에서 받은 정보를 담아둠
                this.setModel(oModel2, "Compo");             // ServiceSet을 통해 받은 전체 정보들을 넣어둠
                this.setModel(oModel3, "Compo2");            // View1에서 선택한 테이블 행의 정보를 넣어둠
                this.setModel(oModel4, "CountData");         // View1 데이터를 기반으로 Card에 띄울 정보를 넣어둠

                
                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);
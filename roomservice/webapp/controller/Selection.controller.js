sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, UIComponent) {
        "use strict";

        return Controller.extend("sync.c201.roomservice.controller.Selection", {
            onInit: function () {

            },

            /**
             * 현재 view Router값 get
             */
            getRouter : function(){
                return UIComponent.getRouterFor(this);
            },

            /**
             * 입력한 값을 들고 다음 페이지로 navTo
             */
            onNavList : function (oEvent) {

                this._onInputCheck();

                var oCompoModel = this.getOwnerComponent().getModel("InfoData");

                var oInput1 = this.getView().byId("plantInfo");
                var oInput2 = this.getView().byId("depNmInfo");
                var oInput3 = this.getView().byId("empNmInfo");

                var sValue1 = oInput1.getSelectedItem().mProperties.text,
                    sValue2 = oInput2.getValue(),
                    sValue3 = oInput3.getValue();

                oCompoModel.setProperty("/sPlant", sValue1);
                oCompoModel.setProperty("/sDepNm", sValue2);
                oCompoModel.setProperty("/sEmpNm", sValue3);

                var oInput = this.getView().byId('empNmInfo');

                if (oInput.getValueState() === "None") {
                    
                    this.getRouter().navTo("RouteView1");

                };

            },

            /**
             * 직원 이름 입력값 확인
             */
             _onInputCheck : function () {

                var oInput = this.getView().byId('empNmInfo');
                var sValue = oInput.getValue();

                if (oInput.getRequired() && sValue.length === 0) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText("이름을 입력해주세요.");
                } else {
                    oInput.setValueState("None");
                };

             },


        });
    });

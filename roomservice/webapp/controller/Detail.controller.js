sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/f/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter"
],
    /**
     * 초기 화면 띄울 때의 설정 값
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */

    function (Controller, JSONModel, History, UIComponent, library,
        MessageToast, MessageBox, Filter) {
        "use strict";

        var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

        var DynamicPageTitleArea = library.DynamicPageTitleArea;

        return Controller.extend("sync.c201.roomservice.controller.Detail", {
            onInit: function () {

                var oDetailModel = new JSONModel({

                    bVisible1 : null,
                    bVisible2 : null,
                    iTotal : 0,
                    sCurky : null,
                    bEnabled : false,
                    bVisible_cancel : true,

                });

                this.getView().setModel(oDetailModel, "detailModel");

                var oRouter = this.getRouter();
                oRouter.getRoute("detail").attachPatternMatched(this._getCheckList, this);

            },


            /**
             * 해당 페이지를 받아옴
             */
            getPage: function () {
                return this.byId("checkItemPage");
            },


            /**
             * 모두 체크했다고 버튼을 클릭할 때 footer에서 총 액수를 보여줌
             */
            onToggleFooterAC: function () {

                this._checkCheckboxStatus();

                this.getPage().setShowFooter(true);
                this.getView().getModel("detailModel").setProperty("/bVisible1", false);
                this.getView().getModel("detailModel").setProperty("/bVisible2", true);

            },


            /**
             * Contact 버튼을 누르면 연락처 toast를 띄울 수 있는 버튼을 보여줌
             */
            onToggleFooterContact: function () {

                this.getPage().setShowFooter(true);
                this.getView().getModel("detailModel").setProperty("/bVisible1", true);
                this.getView().getModel("detailModel").setProperty("/bVisible2", false);
            },


            /**
             * 해당 view의 router 값을 받아옴
             */
            getRouter : function () {
                return UIComponent.getRouterFor(this);
            },


            /**
             * 뒤로가기 버튼 기능 수행
             */
            onNavBack: function () {

                var oHistory, sPreviousHash;
    
                oHistory = History.getInstance();
                sPreviousHash = oHistory.getPreviousHash();
    
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.getRouter().navTo("RouteView1", {}, true /*no history*/);
                }
            },


            /**
             * 토글 영역 관련 함수 (용도 ????? )
             */
            toggleAreaPriority: function () {
                var oTitle = this.getPage().getTitle(),
                    sNewPrimaryArea = oTitle.getPrimaryArea() === DynamicPageTitleArea.Begin ? DynamicPageTitleArea.Middle : DynamicPageTitleArea.Begin;
                oTitle.setPrimaryArea(sNewPrimaryArea);
            },


            /**
             * FB 팀 연락처 띄움
             */
            onPressContactFB: function () {

                var oCompoModel = this.getOwnerComponent().getModel("InfoData");
                var sValue = oCompoModel.getProperty("/sPlant");

                this.getPage().setShowFooter(false);

                if ( sValue == "서울 본점" ) {

                    MessageToast.show("Tel : 02-9876-5432");

                } else {

                    MessageToast.show("Tel : 064-9876-5432");

                };
            },


            /**
             * Contact 문구 버튼 클릭하면 footer 사라짐
             */
            onMessageButtonPress : function () {

                this.getPage().setShowFooter(false);
                
            },


            /**
             * 원하는 조건으로 filtering
             */
             _getCheckList: function() {

                var oCondModel = this.getOwnerComponent().getModel('Compo2');

                var oTable = this.getView().byId("checkItemTable"),
                    oBinding = oTable.getBinding("items");

                var sValue = oCondModel.getProperty("/sOrderid");

                if ( sValue === null ) {
                    if ( sValue === null ) {

                        var oRouter = this.getRouter();
                        oRouter.navTo('RouteView1');
    
                    };
                };

                var aFilter = [];

                var OrderidFilter = new Filter({
                    path: 'Orderid', operator: 'EQ', value1: sValue
                });

                aFilter.push(OrderidFilter);

                oBinding.filter(aFilter);

                this._saveCheckData(sValue);
            
            },
            

            /**
             * 확인 버튼을 누르면 전체 내역을 확인했는지 한 번 더 팝업창으로 물어봄
             */
            onPressConfirm : function () {

                var oCondModel = this.getOwnerComponent().getModel('Compo2');
                var sValue1 = oCondModel.getProperty("/sBookid");
                var sValue2 = oCondModel.getProperty("/sOrderid");
                var sValue3 = oCondModel.getProperty("/sRoomno");

                var sValue4 = sValue3.substr(1,)

                var sBookid = "<li>예약 번호 : " + sValue1 + "</li>";
                var sOrderid = "<li>주문 번호 : " + sValue2 + "</li>";
                var sRoomno = "<li>객실 호수 : " + sValue4 + "호</li>";

                MessageBox.information("모든 주문 목록을 확인했습니까?", {
                    title: "Are you sure?",
                    id: "messageBoxId1",
                    details: sBookid+ sOrderid + sRoomno,
                    contentWidth: "100px",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function(oAction) {
                        if (oAction == "OK") {
                            this._onUpdate();
                            var oRouter = this.getRouter();
                            oRouter.navTo('RouteView1');
                        }
                    }.bind(this),
					emphasizedAction: MessageBox.Action.OK,
                    styleClass: sResponsivePaddingClasses,
                    
                });

            },
            

            /**
             * 변경된 내용 ABAP Dictionary (테이블 ZTC2SD1014에 반영)
             */
            _onUpdate : function () {

                var sFinished = "FINISHED";
                var oViewModel = this.getView().getModel("Checkdata");

                var iCheck = 0;

                for(var i = 0; i<oViewModel.oData.length; i++){

                    var sPath_os = "/" + i + "/Orderstat";
                    var sPath_cs = "/" + i + "/Csstat";

                    oViewModel.setProperty(sPath_os, sFinished);
                    oViewModel.setProperty(sPath_cs, sFinished);

                    var sPath_pl = "/" + i + "/Plant";
                    var sPath_bi = "/" + i + "/Bookid";
                    var sPath_oi = "/" + i + "/Orderid";
                    var sPath_pi = "/" + i + "/Prodid";

                    var sPlant = oViewModel.getProperty(sPath_pl);
                    var sBookid = oViewModel.getProperty(sPath_bi);
                    var sOrderid = oViewModel.getProperty(sPath_oi);
                    var sProdid = oViewModel.getProperty(sPath_pi);
                    var sOrderstat = oViewModel.getProperty(sPath_os);
                    var sCsstat = oViewModel.getProperty(sPath_cs);

                    var oData = { 
                                    Plant     : sPlant, 
                                    Bookid    : sBookid,
                                    Orderid   : sOrderid,
                                    Prodid    : sProdid,
                                    Orderstat : sOrderstat,
                                    Csstat    : sCsstat,
                                };

                    var sPath_check_update = "/ServiceSet(Plant='" + sPlant +  
                                            "',Bookid='" + sBookid + "',Orderid='" + sOrderid + 
                                            "',Prodid='" + sProdid + 
                                            "')";

                    var oModel = this.getView().getModel();  

                    // PUT (update 요청)
                    oModel.update(sPath_check_update, oData, { success : function () {
                        iCheck = iCheck + 1
                    }, error: function(oError){
                        console.log('주문 수행 성공 내역 업데이트 실패');
                    }});

                    //////////

                    // $.ajax({
                    //     url: '/sap/opu/odata/sap/ZGWC2SD1002_SRV' + sPath,
                    //     async: true,
                    //     dataType: 'json',
                    //     data: JSON.stringify(oData),
                    //     contentType: "application/json",
                    //     type: "PUT", // http method 
                    //     success: function(data, response){
                    //         iCheck = iCheck + 1
                    //     }
                    // });

                };

                if ( iCheck === oViewModel.oData.length) {
                    MessageToast.show("업데이트에 성공하였습니다.");
                };

            },


            /**
             * 목록에서 check하면 Compo 모델에도 check된 기록이 남도록 함
             */
            onSetCheck : function (oEvent) {

                this.getPage().setShowFooter(false);
                
                var oCompoModel = this.getOwnerComponent().getModel("Compo");
                var sIndex = oEvent.getSource().mBindingInfos.selected.binding.oContext.sPath;
                var sPath_check = sIndex + "/orderCheck";
                var bCheck = oEvent.getSource().mProperties.selected;

                oCompoModel.setProperty(sPath_check, bCheck);

            },


            /**
             * 목록에 있는 내역들의 총 액수를 계산함
             */
            _calcTotal : function (oCheckModel) {

                var oDetailModel = this.getView().getModel("detailModel");
                var oCheckData = oCheckModel.oData;
                var iCalcPart = 0;
                var iCalcTotal = 0;
                var sCurky = null;

                for (var i=0;i<oCheckData.length;i++) {
                    iCalcPart = oCheckData[i].Saleprce * oCheckData[i].Prodcnt;
                    iCalcTotal = iCalcTotal + iCalcPart;
                    iCalcPart = 0;
                    sCurky = oCheckData[i].Prodcuky
                };

                var sCalcTotal = iCalcTotal.toLocaleString();


                oDetailModel.setProperty('/iTotal', sCalcTotal);
                oDetailModel.setProperty('/sCurky', sCurky);

            },


            /**
             * Detail 에 뜨는 목록만 Checkdata Model로 따로 저장
             */
            _saveCheckData : function (sOrderid) {

                var oCompo = this.getOwnerComponent().getModel('Compo');
                var oData  = oCompo.oData;
                var oFiteredData = oData.filter(m => m.Orderid == sOrderid);

                var oJSONModel2 = new JSONModel(oFiteredData);
                this.getView().setModel(oJSONModel2, 'Checkdata');

                var oCheckModel = this.getView().getModel('Checkdata');
                
                this._calcTotal(oCheckModel);
                this._visibleCancelButton(oCheckModel);
                
            },


            /**
             * Order Cancle 버튼 클릭
             */
            onOrderCancel : function () {

                var oCheckModel = this.getView().getModel("Checkdata");
                var oCheckData  = oCheckModel.oData;
                var oCompoModel = this.getOwnerComponent().getModel("Compo");

                var aIndex = [];

                for (var i=0;i<oCompoModel.oData.length;i++) {
                    for (var j=0;j<oCheckData.length;j++) {
                        if ( oCompoModel.oData[i].Bookid === oCheckData[j].Bookid &&
                            oCompoModel.oData[i].Orderid === oCheckData[j].Orderid &&
                            oCompoModel.oData[i].Prodid === oCheckData[j].Prodid ) {
                                aIndex.push(i);
                            };
                        };
                };

                for (var i=0;i<aIndex.length;i++) {

                    var iIndex = aIndex[i];

                    var sPath_sel_csstat = '/' + iIndex + '/Csstat';
                    var sPath_indicator3= '/' + iIndex + '/indicator3';
                    var sPath_sel_check_another = '/' + iIndex + '/csCheck';
                    var sPath_sel_check_enabled = '/' + iIndex + '/csCheckEnabled';

                    var ssetStatus = 'STANDBY';
                    var sIndicator_color = 'Information';
                    var sCheck = false;
                    var sCheck_en = true;

                    oCompoModel.setProperty(sPath_sel_csstat, ssetStatus);
                    oCompoModel.setProperty(sPath_indicator3, sIndicator_color);
                    oCompoModel.setProperty(sPath_sel_check_another, sCheck);
                    oCompoModel.setProperty(sPath_sel_check_enabled, sCheck_en);

                    this._onUpdate_cancel(aIndex, ssetStatus);

                };

            },


            /**
             * 주문 수행이 완료된 경우 order cancel 버튼이 보이지 않도록 설정
             */
             _visibleCancelButton : function (oCheckModel) {
                
                var oDetailModel = this.getView().getModel("detailModel");
                var oCheckData = oCheckModel.oData;
                var iCheckCount = 0;

                for (var i=0;i<oCheckData.length;i++) {
                    if ( oCheckData[i].Orderstat === "FINISHED" ) {
                        iCheckCount = iCheckCount + 1;
                    };
                };

                if ( iCheckCount === oCheckData.length ) {        // 주문 수행이 완료된 경우

                    oDetailModel.setProperty('/bVisible_cancel', false);
                    oDetailModel.setProperty('/bEnabled', false);
                    oDetailModel.setProperty('/bVisible1', false);
                    oDetailModel.setProperty('/bVisible2', true);
                    this.getPage().setShowFooter(true);


                } else {

                    oDetailModel.setProperty('/bVisible_cancel', true);
                    oDetailModel.setProperty('/bEnabled', true);
                    oDetailModel.setProperty('/bVisible1', false);
                    oDetailModel.setProperty('/bVisible2', true);
                    this.getPage().setShowFooter(false);

                };

             },


            /**
             * 변경된 값 ("ONGOING -> STANDBY") ABAP TABLE에 반영
             */
             _onUpdate_cancel : function (aIndex, ssetStatus) {

                var oCompoModel = this.getOwnerComponent().getModel("Compo");  // 데이터가 담겨있는 곳 
                
                for (var i=0;i<aIndex.length;i++) {
                    
                    var iIndex = aIndex[i];

                    var sPath_cs = '/' + iIndex + "/Csstat";
                    var sPath_os = '/' + iIndex + "/Orderstat";
                    
                    oCompoModel.setProperty(sPath_cs, ssetStatus);

                    var sPath_pl = '/' + iIndex + "/Plant";
                    var sPath_bi = '/' + iIndex + "/Bookid";
                    var sPath_oi = '/' + iIndex + "/Orderid";
                    var sPath_pi = '/' + iIndex + "/Prodid";

                    var sPlant     = oCompoModel.getProperty(sPath_pl);
                    var sBookid    = oCompoModel.getProperty(sPath_bi);
                    var sOrderid   = oCompoModel.getProperty(sPath_oi);
                    var sProdid    = oCompoModel.getProperty(sPath_pi);
                    var sCsstat    = oCompoModel.getProperty(sPath_cs);
                    var sOrderstat = oCompoModel.getProperty(sPath_os);

                    var oData = { 
                                    Plant     : sPlant, 
                                    Bookid    : sBookid,
                                    Orderid   : sOrderid,
                                    Prodid    : sProdid,
                                    Orderstat : sOrderstat,
                                    Csstat    : sCsstat
                                };

                    var sPath_check_update = null;

                    sPath_check_update = "/ServiceSet(Plant='" + sPlant +  
                                            "',Bookid='" + sBookid + "',Orderid='" + sOrderid + 
                                            "',Prodid='" + sProdid + 
                                            "')";

                    var oModel = this.getView().getModel();  

                    // PUT (update 요청)
                    oModel.update(sPath_check_update, oData, { success : function () {

                    }, error: function(oError){
                        console.log('standby <-> ongoing 업데이트 실패')
                    }});
                        
                    //////////

                    // $.ajax({
                    //     url: '/sap/opu/odata/sap/ZGWC2SD1002_SRV' + sPath_check_update,
                    //     async: true,
                    //     dataType: 'json',
                    //     data: JSON.stringify(oData),
                    //     contentType: "application/json",
                    //     type: "PUT", // http method 
                    //     success: function(data, response){
                    //         // console.log('성공');
                    //     }
                    // });

                }; // for문 닫는 괄호


                if ( ssetStatus == "STANDBY" ) {
                    MessageToast.show("주문 수락 내용을 \n취소하였습니다.")
                    var oRouter = this.getRouter();
                        oRouter.navTo('RouteView1');
                };
            },


            /**
             * 목록 체크를 모두 했는지 확인
             */
             _checkCheckboxStatus : function () {

                var oCheckModel = this.getView().getModel("Checkdata");
                var oCheckData = oCheckModel.oData;
                var oDetailModel = this.getView().getModel("detailModel")
                var iCount_false = 0;

                for( var i=0;i<oCheckData.length;i++ ) {
                    if ( oCheckData[i].orderCheck === false ) {
                        iCount_false = iCount_false + 1;
                    }
                };

                if ( iCount_false > 0) {
                    MessageToast.show("확인되지 않은 목록이 \n" + iCount_false + "개 존재합니다.")
                    oDetailModel.setProperty('/bEnabled', false);
                } else {
                    MessageToast.show("총 액수 확인 후 \nConfirm 버튼을 \n눌러주세요.")
                    oDetailModel.setProperty('/bEnabled', true);
                } 

             },


        });
    });
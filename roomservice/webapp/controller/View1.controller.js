sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
    "sap/m/MessageToast",
	"sap/m/MessageBox",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, UIComponent, Fragment, Filter, MessageToast, MessageBox) {
        "use strict";

        return Controller.extend("sync.c201.roomservice.controller.View1", {
            onInit: function () {

                var oRouter = this.getRouter();
                oRouter.getRoute("RouteView1").attachPatternMatched(this._onObjectMatched, this);
                
            },

            /**
             * 화면에 도달할 때마다 실행되는 함수
             */
            _onObjectMatched : function () {

                // filter 조건에서 전달 완료 내역일 때 fb column 안 보이게 설정, 다른 곳 갔다가 돌아왔을 때 첫번째 필터로 설정해두기
                var oData = {
                    bVisibleCS  : true,
                    bVisibleCSON : false,
                    bsetFilter : null,
                }

                var oModel = new JSONModel(oData);

                this.getView().setModel(oModel, "view1");  // view1 내에서 속성 제어를 위한 model

                var oModel = this.getOwnerComponent().getModel();
                var oComponentModel = this.getOwnerComponent().getModel('Compo');
                var oCompo2Model = this.getOwnerComponent().getModel('Compo2');
                var oCountModel = this.getOwnerComponent().getModel('CountData');
                var oInfoModel = this.getOwnerComponent().getModel('InfoData');
                // var aFilter = this._selectPlantFilter();

                if ( oInfoModel.oData.sPlant === null ) {
                    this.getRouter().navTo("selection");
                }

                this._getReadServiceSet(oModel, [], oComponentModel, oCountModel, oInfoModel);

                var oViewModel = this.getView().getModel("view1");

                var sFilter = oCompo2Model.getProperty('/sFilter');
                oViewModel.setProperty('/bsetFilter', sFilter);

                this._selectFirstFilter();

            },


            /**
             * 맨처음 filter값을 반영한 필터를 씌우기 위함
             */
             _selectFirstFilter: function() {

                var oCompoModel = this.getOwnerComponent().getModel("InfoData");
                var sPlant = oCompoModel.getProperty('/sPlant');

                var aFilters = [];
                if(
                    sPlant
                ){
                    var sKey = sPlant === '서울 본점' ? 'S' : 'J';
                    // var sKey = null;
                    // if ( sPlant === "서울 본점" ) {
                    //     sKey = 'S';
                    // } else if ( sPlant === "제주 지점" ) {
                    //     sKey = 'J';
                    // };

                    var sFilter = this.getOwnerComponent().getModel("Compo2").getProperty('/sFilter');
    
                    if (sFilter === "All") {
                        aFilters.push(
                                new Filter([
                                new Filter("Plant", "EQ", sKey)
                            ], true)
                        );
                        
                    } else if (sFilter === "FBok") {
                        aFilters.push(
                            new Filter([
                                new Filter("Fbstat", "EQ", "FINISHED"), 
                                new Filter("Orderstat", "NE", "FINISHED"),
                                new Filter("Plant", "EQ", sKey)
                            ], true)

                        );
                    } else if (sFilter === "CSok") {
                        aFilters.push(
                            new Filter([
                                new Filter("Orderstat", "EQ", "FINISHED"),
                                new Filter("Plant", "EQ", sKey)
                            ], true)
                        );
                    } else if (sFilter === null ) {
                        aFilters.push(
                            new Filter([
                                new Filter("Plant", "EQ", sKey)
                            ], true)
                        );
                    };

                };
                
                this._setFirstVisibleColumn();

                return aFilters;

            },

            /**
             * Filter 종류 따라 column을 보여줬다, 안 보여줬다 설정
             * 준비 완료일 때 CS ONGOING column 편집 할 수 있게 설정
             */
             _setFirstVisibleColumn: function () {

                var sKey = this.getOwnerComponent().getModel("Compo2").getProperty('/sFilter');

                var oCompoModel = this.getOwnerComponent().getModel("Compo");
                var oModel = this.getView().getModel("view1");

                var bVisibleCSON = null;
                var bVisible = null;

                if (sKey === "All" || sKey === null) {

                    bVisibleCSON = false;
                    bVisible = true;
                    
                } else if (sKey === "FBok") {

                    bVisibleCSON = true;
                    bVisible = true;

                    for(var i=0;i<oCompoModel.oData.length;i++) {
                        var sPath_set = null;
                        if ( oCompoModel.oData[i].Csstat === 'STANDBY' ) {
                            sPath_set = '/' + i + '/csCheckEnabled'
                            oCompoModel.setProperty(sPath_set, true);
                        } else if ( oCompoModel.oData[i].Csstat === 'ONGOING' ) {
                            sPath_set = '/' + i + '/csCheck';
                            oCompoModel.setProperty(sPath_set, true);
                        }
                    }
                    
                } else if (sKey === "CSok") {

                    bVisibleCSON = false;
                    bVisible = false;
                    
                };

                oModel.setProperty('/bVisibleCSON', bVisibleCSON);
                oModel.setProperty('/bVisibleCS', bVisible);
                
            },


            /**
             * ServiceSet을 읽는 함수.
             * JSONModel에 데이터를 담아주는 역할
             * oModel을 받아와, aFilter로 필터링한 후 oJSONModel과 oComponentModel에 넣어줌
             */
             _getReadServiceSet: function(oModel, aFilter, oComponentModel, oCountModel, oInfoModel) {
                oModel.read("/ServiceSet", {
                    filters: aFilter,
                    success: function(oData) {
                        
                        var aResult = oData.results;

                        var iCheck_fb_finished_s = 0;
                        var iCheck_cs_ongoing_s  = 0;
                        var iCheck_cs_finished_s = 0;

                        var iCheck_fb_finished_j = 0;
                        var iCheck_cs_ongoing_j  = 0;
                        var iCheck_cs_finished_j = 0;

                        // 값을 담을 때 각 상태의 글자에 따라 색깔을 달리 해줌
                        // 값을 담을 때 카드에 담을 값도 계산 함
                        for(var i = 0; i<aResult.length; i++){

                            if ( aResult[i].Fbstat == 'FINISHED' &&
                                    aResult[i].Orderstat == 'ONGOING') {
                                aResult[i].indicator1 = "Success";

                                if( aResult[i].Plant == 'S' ) {
                                    iCheck_fb_finished_s = iCheck_fb_finished_s + 1;
                                } else if ( aResult[i].Plant == 'J' ) {
                                    iCheck_fb_finished_j = iCheck_fb_finished_j + 1;
                                };

                            } 
                            else if ( aResult[i].Fbstat == 'FINISHED' ) {
                                aResult[i].indicator1 = "Success";

                            } 
                            else if ( aResult[i].Fbstat == 'ONGOING' ) {
                                aResult[i].indicator1 = "Error";

                            } else {
                                aResult[i].indicator1 = "Information"
                            };

                            if ( aResult[i].Orderstat == 'FINISHED') {
                                aResult[i].indicator2 = "Success";

                            } else if ( aResult[i].Orderstat == 'ONGOING' ) {
                                aResult[i].indicator2 = "Error";

                            } else {
                                aResult[i].indicator2 = "Information";
                            }

                            if ( aResult[i].Csstat == "FINISHED" ) {
                                aResult[i].indicator3 = "Success";

                                if( aResult[i].Plant == 'S' ) {
                                    iCheck_cs_finished_s = iCheck_cs_finished_s + 1;
                                } else if ( aResult[i].Plant == 'J' ) {
                                    iCheck_cs_finished_j = iCheck_cs_finished_j + 1;
                                };
                                
                                
                            } else if ( aResult[i].Csstat == "ONGOING" ) {
                                aResult[i].indicator3 = "Error";

                                if( aResult[i].Plant == 'S' ) {
                                    iCheck_cs_ongoing_s = iCheck_cs_ongoing_s + 1;
                                } else if ( aResult[i].Plant == 'J' ) {
                                    iCheck_cs_ongoing_j = iCheck_cs_ongoing_j + 1;
                                };

                            } else {
                                aResult[i].indicator3 = "Information";
                            }

                            aResult[i].csCheck = false;               // 주문 수락 -> 수행 중
                            aResult[i].csCheckEnabled = false;        // 주문 수락 후 수행 중인 경우
                            
                            if ( aResult[i].Orderstat == "FINISHED" ) {
                                aResult[i].orderCheck        = true;            // 주문 목록 내역 확인용
                                aResult[i].orderCheckEnabled = false;            // 주문 목록 내역 확인용
                            } else {
                                aResult[i].orderCheck        = false;
                                aResult[i].orderCheckEnabled = true;
                            };

                        };

                        oComponentModel.setData(aResult);

                        if ( oInfoModel.oData.sPlant === '서울 본점') {

                            oCountModel.setProperty('/iCheck_fb_f', iCheck_fb_finished_s);
                            oCountModel.setProperty('/iCheck_cs_o', iCheck_cs_ongoing_s);
                            oCountModel.setProperty('/iCheck_cs_f', iCheck_cs_finished_s);

                        } else if ( oInfoModel.oData.sPlant === '제주 지점') {

                            oCountModel.setProperty('/iCheck_fb_f', iCheck_fb_finished_j);
                            oCountModel.setProperty('/iCheck_cs_o', iCheck_cs_ongoing_j);
                            oCountModel.setProperty('/iCheck_cs_f', iCheck_cs_finished_j);

                        };

                        this.byId('RoomServiceTable')
                            .getBinding('items')
                            .filter(
                                this._selectFirstFilter()
                            )

                    }.bind(this),

                    error: function() {

                    }
                    
                });

            },

            /**
             * 해당 view의 page를 받아옴
             */
            getPage : function() {
            return this.byId("dynamicPageId");
            },


            /**
             * 해당 view의 router 정보를 받아옴
             */
             getRouter : function(){
                return UIComponent.getRouterFor(this);
            },


            /**
             * 클릭한 테이블 행의 정보를 저장해 둔 뒤, 다음 화면 (detail)로 nav
             */
            onCheckOrder : function (oEvent) {

                var oItem = oEvent.getSource();
                var oBindingContext = oItem.getBindingContextPath();
                var sIndex = oBindingContext.substr(1,);
                var oModel = this.getView().getModel('Compo').getData('Compo')[sIndex];

                var sBookid = oModel.Bookid;
                var sOrderid = oModel.Orderid;
                var sRoomno = oModel.Roomno;
                var sCsstat = oModel.Csstat;

                var oCompo2Model = this.getOwnerComponent().getModel('Compo2');
                oCompo2Model.setProperty("/sBookid", sBookid);
                oCompo2Model.setProperty("/sOrderid", sOrderid);
                oCompo2Model.setProperty("/sRoomno", sRoomno);

                if ( sCsstat === "STANDBY" ) {
                    MessageToast.show("주문 접수를 먼저 해주세요.")
                } else if ( sCsstat === "ONGOING" ) {
                    this.getRouter().navTo("detail");

                } else if ( sCsstat === "FINISHED" ) {
                    var that = this;
                    this._onCheckToShow(that);

                } else {
                    MessageToast.show("주문 수행 가능 상태가 \n아닙니다")
                }

            },


            /**
             * 이전 화면으로 돌아갈 때 history 내역 확인, 또는 selection 화면으로 이동
             */
            onNavBack: function (oEvent) {

                this.getRouter().navTo("selection", {}, true /*no history*/);

                // var oHistory, sPreviousHash;
    
                // oHistory = History.getInstance();
                // sPreviousHash = oHistory.getPreviousHash();
    
                // if (sPreviousHash !== undefined) {
                //     window.history.go(-1);
                // } else {
                //     this.getRouter().navTo("selection", {}, true /*no history*/);
                // }
            },


            /**
             * Footer 영역을 보여줌
             */
            onToggleFooter: function () {
                this.getPage().setShowFooter(true);
            },


            /**
             * 상단에 작은 팝업으로 정보를 띄워줌 (Card.xml을 통해서)
             */
             onGenericTagPress: function (oEvent) {

                this._setCardData();

                var oView = this.getView(),
                    oSourceControl = oEvent.getSource();
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "sync.c201.roomservice.view.Card"
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
    
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oSourceControl);
                });
            },

            
            /**
             * Icon Tab Filter 값을 정해줌
             */
            onFilterSelect: function (oEvent) {
                var oCompoModel = this.getOwnerComponent().getModel('InfoData');
                var sPlant = oCompoModel.oData.sPlant;
                var sInfoPlant = null;

                if ( sPlant === "서울 본점" ) {
                    sInfoPlant = 'S';
                } else if ( sPlant === "제주 지점" ) {
                    sInfoPlant = 'J';
                };

                var oCompo2Model = this.getOwnerComponent().getModel('Compo2');

                var oBinding = this.byId("RoomServiceTable").getBinding("items"),
                    sKey = oEvent.getParameter("key"),
                    // Array to combine filters
                    aFilters = [];
    
                if (sKey === "All") {
                    aFilters.push(
                            new Filter([
                            new Filter("Plant", "EQ", sInfoPlant)
                        ], true)
                    );
                    
                } else if (sKey === "FBok") {
                    aFilters.push(
                            new Filter([
                            new Filter("Fbstat", "EQ", "FINISHED"), 
                            new Filter("Orderstat", "NE", "FINISHED"),
                            new Filter("Plant", "EQ", sInfoPlant)
                        ], true)
                    );
                } else if (sKey === "CSok") {
                    aFilters.push(
                            new Filter([
                            new Filter("Orderstat", "EQ", "FINISHED"),
                            new Filter("Plant", "EQ", sInfoPlant)
                        ], true)
                    );


                };
    
                oBinding.filter(aFilters);
                
                oCompo2Model.setProperty('/sFilter', sKey);

                this._setVisibleColumn(oEvent);

            },


            /**
             * Filter 종류 따라 column을 보여줬다, 안 보여줬다 설정
             * 준비 완료일 때 CS ONGOING column 편집 할 수 있게 설정
             */
            _setVisibleColumn: function (oEvent) {

                var sKey = oEvent.getParameter("key");

                var oCompoModel = this.getOwnerComponent().getModel("Compo");
                var oModel = this.getView().getModel("view1");

                var bVisibleCSON = null;
                var bVisible = null;

                if (sKey === "All") {

                    bVisibleCSON = false;
                    bVisible = true;
                    
                } else if (sKey === "FBok") {

                    bVisibleCSON = true;
                    bVisible = true;

                    for(var i=0;i<oCompoModel.oData.length;i++) {
                        var sPath_set = null;
                        if ( oCompoModel.oData[i].Csstat === 'STANDBY' ) {
                            sPath_set = '/' + i + '/csCheckEnabled'
                            oCompoModel.setProperty(sPath_set, true);
                        } else if ( oCompoModel.oData[i].Csstat === 'ONGOING' ) {
                            sPath_set = '/' + i + '/csCheck';
                            oCompoModel.setProperty(sPath_set, true);
                        }
                    }
                    
                } else if (sKey === "CSok") {

                    bVisibleCSON = false;
                    bVisible = false;
                    
                };

                oModel.setProperty('/bVisibleCSON', bVisibleCSON);
                oModel.setProperty('/bVisibleCS', bVisible);
                
            },


            /**
             * Footer에서 Info Desk로 연락할 때 지점에 따라 번호를 달리 보여줌
             */
            onPressContactID: function () {

                var oCompoModel = this.getOwnerComponent().getModel("InfoData");
                var sValue = oCompoModel.getProperty("/sPlant");

                if ( sValue == "서울 본점" ) {

                    MessageToast.show("Tel : 02-1234-5678");

                } else {

                    MessageToast.show("Tel : 064-1234-5678");

                };

            },


            /**
             * Footer에서 Food & Beverage로 연락할 때 지점에 따라 번호를 달리 보여줌
             */
            onPressContactFB: function () {

                var oCompoModel = this.getOwnerComponent().getModel("InfoData");
                var sValue = oCompoModel.getProperty("/sPlant");

                if ( sValue == "서울 본점" ) {

                    MessageToast.show("Tel : 02-9876-5432");

                } else {

                    MessageToast.show("Tel : 064-9876-5432");

                };
            },


            /**
             * footer 영역을 안 보이게 해줌
             */
            onMessageButtonPress : function () {

                this.getPage().setShowFooter(false);
                
            },

            
            /**
             * 고객 서비스팀에서 주문을 수락함
             */
             onOngoing : function (oEvent) {
                
                var oCompoModel = this.getOwnerComponent().getModel("Compo");

                var sIndex = oEvent.getSource().mBindingInfos.selected.binding.oContext.sPath;   // like '/3'
                var aIndex = [];

                var sPath_sel_bookid = sIndex + '/Bookid';
                var sPath_sel_orderid = sIndex + '/Orderid';

                var sPath_sel_check = sIndex + '/csCheck';
                
                var sBookid = oCompoModel.getProperty(sPath_sel_bookid);
                var sOrderid = oCompoModel.getProperty(sPath_sel_orderid);
                var sCheck = oCompoModel.getProperty(sPath_sel_check);

                for (var i=0;i<oCompoModel.oData.length;i++) {
                    if ( oCompoModel.oData[i].Bookid === sBookid &&
                         oCompoModel.oData[i].Orderid === sOrderid) {
                            aIndex.push(i);
                         };
                };

                for (var i=0;i<aIndex.length;i++) {

                    var iIndex = aIndex[i];

                    var sPath_sel_csstat = '/' + iIndex + '/Csstat';
                    var sPath_indicator3= '/' + iIndex + '/indicator3';
                    var sPath_sel_check_another = '/' + iIndex + '/csCheck';


                    var ssetStatus = null;
                    var sIndicator_color = null;


                    if ( sCheck === true ) {
                        
                        ssetStatus = 'ONGOING';
                        sIndicator_color = 'Error';

                    } else {

                        ssetStatus = 'STANDBY';
                        sIndicator_color = 'Information';
                    }

                    oCompoModel.setProperty(sPath_sel_csstat, ssetStatus);
                    oCompoModel.setProperty(sPath_indicator3, sIndicator_color);
                    oCompoModel.setProperty(sPath_sel_check_another, sCheck);

                    this._onUpdate(aIndex, ssetStatus);

                };

            },


            /**
             * 변경된 값 ("STANDBY -> ONGOING" OR "ONGOING -> STANDBY") ABAP TABLE에 반영
             */
             _onUpdate : function (aIndex, ssetStatus) {

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
                    //         console.log('100');
                    //     },
                    //     error: function(oError){
                    //         debugger
                    //     }
                    // });

                }; // for문 닫는 괄호

                if ( ssetStatus == "ONGOING" ) {
                    MessageToast.show("FB Team으로부터 \n주문 내역을 \n전달 받았습니다.")
                } else {
                    MessageToast.show("주문 수행을 \n취소하였습니다.")
                };
                
            },


            /**
             * 초기 접근 이후 Card Data Setting
             */

             _setCardData : function () {

                var oCompoModel = this.getOwnerComponent().getModel('Compo');
                var oCompoData = oCompoModel.oData;
                var oCountModel = this.getOwnerComponent().getModel('CountData');
                var oInfoModel = this.getOwnerComponent().getModel('InfoData');

                var iCheck_fb_finished_s = 0;
                var iCheck_cs_ongoing_s  = 0;
                var iCheck_cs_finished_s = 0;

                var iCheck_fb_finished_j = 0;
                var iCheck_cs_ongoing_j  = 0;
                var iCheck_cs_finished_j = 0;

                for(var i=0;i<oCompoData.length;i++) {

                    if ( oCompoData[i].Plant === 'S' ) {
                        if ( oCompoData[i].Fbstat === 'FINISHED'  &&
                            oCompoData[i].Orderstat === 'ONGOING') {
                            iCheck_fb_finished_s = iCheck_fb_finished_s + 1;
                        }
                        
                        if ( oCompoData[i].Csstat === 'ONGOING' ) {
                            iCheck_cs_ongoing_s = iCheck_cs_ongoing_s + 1;
                        } else if ( oCompoData[i].Csstat === 'FINISHED' ) {
                            iCheck_cs_finished_s = iCheck_cs_finished_s + 1;
                        };

                    } else if ( oCompoData[i].Plant === 'J' ) {

                        if ( oCompoData[i].Fbstat === 'FINISHED' ) {
                            iCheck_fb_finished_j = iCheck_fb_finished_j + 1;
                        }
                        
                        if ( oCompoData[i].Csstat === 'ONGOING' ) {
                            iCheck_cs_ongoing_j = iCheck_cs_ongoing_j + 1;
                        } else if ( oCompoData[i].Csstat === 'FINISHED' ) {
                            iCheck_cs_finished_j = iCheck_cs_finished_j + 1;
                        };

                    };
                };

                if ( oInfoModel.oData.sPlant === '서울 본점') {

                    oCountModel.setProperty('/iCheck_fb_f', iCheck_fb_finished_s);
                    oCountModel.setProperty('/iCheck_cs_o', iCheck_cs_ongoing_s);
                    oCountModel.setProperty('/iCheck_cs_f', iCheck_cs_finished_s);

                } else if ( oInfoModel.oData.sPlant === '제주 지점') {

                    oCountModel.setProperty('/iCheck_fb_f', iCheck_fb_finished_j);
                    oCountModel.setProperty('/iCheck_cs_o', iCheck_cs_ongoing_j);
                    oCountModel.setProperty('/iCheck_cs_f', iCheck_cs_finished_j);

                };

             },


             /**
              * 이미 수행이 완료된 내역을 볼 때 확인창 띄워줌
              */
             _onCheckToShow: function (that) {
                MessageBox.information("주문 수행이 완료된 목록입니다. \n상세 주문 내역을 확인하시겠습니까?", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {

                        if ( sAction === "OK" ) {
                            var oRouter = that.getRouter();
                        oRouter.navTo('detail');
                        } else {
                            MessageToast.show("상세 내역 확인을 \n취소하였습니다.")
                        }
                    }
                });
            },



        });
    });

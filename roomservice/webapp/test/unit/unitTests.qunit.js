/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"syncc201/roomservice/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});

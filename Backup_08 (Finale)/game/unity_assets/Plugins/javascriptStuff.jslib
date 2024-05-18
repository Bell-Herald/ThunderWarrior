mergeInto(LibraryManager.library, {
  sendInput: function (shootRequest, movingXRequest, movingZRequest, mouseXRequest, mouseYRequest, zRequest, xRequest, cRequest, vRequest, qRequest, eRequest, rRequest, tRequest, yRequest, request1, request2, request3, request4, request5, request6, request7, request8, request9, request0) {
    var request = {shoot: shootRequest, movingX: movingXRequest, movingZ: movingZRequest, mouseX: mouseXRequest, mouseY: mouseYRequest, abilityZ: zRequest, abilityX: xRequest, abilityC: cRequest, abilityV: vRequest, abilityQ: qRequest, abilityE: eRequest, abilityR: rRequest, abilityT: tRequest, abilityY: yRequest, ability1: request1, ability2: request2, ability3: request3, ability4: request4, ability5: request5, ability6: request6, ability7: request7, ability8: request8, ability9: request9, ability0: request0};
    sendInputAndRoom(request);
  }
});
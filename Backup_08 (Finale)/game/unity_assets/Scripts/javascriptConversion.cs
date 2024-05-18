using UnityEngine;
using System.Runtime.InteropServices;

public static class JSC {
    [DllImport("__Internal")]
    public static extern void sendInput(bool shootRequest, float movingXRequest, float movingZRequest, float mouseXRequest, float mouseYRequest, bool zRequest, bool xRequest, bool cRequest, bool vRequest, bool qRequest, bool eRequest, bool rRequest, bool tRequest, bool yRequest, bool request1, bool request2, bool request3, bool request4, bool request5, bool request6, bool request7, bool request8, bool request9, bool request0);
}
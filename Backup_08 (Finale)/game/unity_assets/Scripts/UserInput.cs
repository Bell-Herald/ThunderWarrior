using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UserInput : MonoBehaviour
{
    void Start() {
        //Cursor.lockState = CursorLockMode.Locked;
    }
    void Update()
    {
        float rotX = 0;
        float rotY = 0;
        //Debug.Log("fire1: " + Input.GetButton("Fire1") + " | Horizontal" + Input.GetAxisRaw("Horizontal") + " | Vertical" + Input.GetAxisRaw("Vertical") + " | RotX" + Mathf.Max(15 * Input.GetAxis("Rotate X"), Input.GetAxis("Mouse X")) + " | RotY" + Mathf.Max(15 * Input.GetAxis("Rotate Y"), Input.GetAxis("Mouse Y")));
        if(Mathf.Abs(25 * Input.GetAxis("Rotate X")) > Mathf.Abs(Input.GetAxis("Mouse X")))
            rotX = 25 * Input.GetAxis("Rotate X");
        else 
            rotX = Input.GetAxis("Mouse X");
        if(Mathf.Abs(25 * Input.GetAxis("Rotate Y")) > Mathf.Abs(Input.GetAxis("Mouse Y")))
            rotY = 25 * Input.GetAxis("Mouse Y");
        else 
            rotY = Input.GetAxis("Mouse Y");
        JSC.sendInput(
            Input.GetButton("Fire1"),
            Input.GetAxisRaw("Horizontal"),
            Input.GetAxisRaw("Vertical"),
            Mathf.Max(rotX),
            Mathf.Max(rotY),
            Input.GetKey(KeyCode.Z),
            Input.GetKey(KeyCode.X),
            Input.GetKey(KeyCode.C),
            Input.GetKey(KeyCode.V),
            Input.GetKey(KeyCode.Q),
            Input.GetKey(KeyCode.E),
            Input.GetKey(KeyCode.R),
            Input.GetKey(KeyCode.T),
            Input.GetKey(KeyCode.Y),
            Input.GetKey(KeyCode.Alpha1),
            Input.GetKey(KeyCode.Alpha2),
            Input.GetKey(KeyCode.Alpha3),
            Input.GetKey(KeyCode.Alpha4),
            Input.GetKey(KeyCode.Alpha5),
            Input.GetKey(KeyCode.Alpha6),
            Input.GetKey(KeyCode.Alpha7),
            Input.GetKey(KeyCode.Alpha8),
            Input.GetKey(KeyCode.Alpha9),
            Input.GetKey(KeyCode.Alpha0)
        );
    }
}

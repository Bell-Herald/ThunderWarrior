using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class Projectile
{
    public int id;
    public bool updated = false;
    public GameObject obj;
    private Vector3 gun;
    private float lastX = -Mathf.Infinity;
    private float lastZ = -Mathf.Infinity;
    private float xScale;
    private float yScale;
    private float zScale;
    [SerializeField] private static GameObject projectileObject;
    public void update(ProjectileData data) {
        float x = data.x * data.weight + gun.x * (1 - data.weight);
        float z = data.z * data.weight + gun.z * (1 - data.weight);
        obj.transform.position = new Vector3(x, data.y * data.weight + gun.y * (1 - data.weight), z);
        if(lastX != -Mathf.Infinity && lastZ != -Mathf.Infinity) {
            obj.transform.rotation = Quaternion.Euler(90, Mathf.Atan2(x - lastX, z - lastZ) * 180 / Mathf.PI, 0);
        } else {
            obj.transform.rotation = Quaternion.Euler(data.rotX, data.rotY, data.rotZ);
        }
        lastX = x;
        lastZ = z;
        updated = true;
        obj.transform.localScale = new Vector3(xScale * data.opacity, yScale, zScale * data.opacity);
    }
    public Projectile(int projId, GameObject proj, BoxCollider gunBox, SphereCollider gunHeightBox) {
        obj = proj;
        id = projId;
        gun = new Vector3(
            gunBox.transform.TransformPoint(gunBox.center).x,
            gunHeightBox.transform.TransformPoint(gunHeightBox.center).y,
            gunBox.transform.TransformPoint(gunBox.center).z
        );
        xScale = obj.transform.localScale.x;
        yScale = obj.transform.localScale.y;
        zScale = obj.transform.localScale.z;
    }
    public bool Equals(Projectile other) {
        return id == other.id;
    }
}
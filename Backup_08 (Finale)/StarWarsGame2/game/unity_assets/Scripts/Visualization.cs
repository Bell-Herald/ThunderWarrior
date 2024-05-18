using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class Visualization
{
    public GameObject gameOb;
    public LineRenderer lineRend;
    public float id;
    public bool updated = false;
    public Visualization(GameObject newGameOb, VisualizationData data) {
        Color color;
        if(data.af == "ally" && data.actionType == "defense") color = new Color(0,0,0.75f,0.75f);
        else if(data.af == "enemy" && data.actionType == "offense") color = new Color(0.75f,0,0,0.75f);
        else color = new Color(0.75f,0.75f,0.75f,0.75f);
        gameOb = newGameOb;
        lineRend = gameOb.GetComponent<LineRenderer>();
        lineRend.startColor = lineRend.endColor = color;
        id = data.id;
        update(data);
    }
    public void update(VisualizationData data) {
        List<Vector3> arcPoints = new List<Vector3>();
        Vector3[] positions;
        float angle = data.rotY - data.angle / 2;
        float arcLength = data.angle;
        if(arcLength > 360) arcLength = 360;
        int segmentCounter = (int) ((20 * data.scale  - 0.5f) * (arcLength/ 360) * 3);
        if(arcLength < 360) arcPoints.Add(new Vector3(data.x, data.y, data.z));
        for(int i = 0; i <= segmentCounter; i ++) {
            float x = Mathf.Sin(Mathf.Deg2Rad * angle) * data.scale;
            float z = Mathf.Cos(Mathf.Deg2Rad * angle) * data.scale;
            arcPoints.Add(new Vector3(data.x + x, data.y + 0, data.z + z));
            angle += (arcLength / segmentCounter);
        }
        if(arcLength < 360) {
            arcPoints.Insert(1, new Vector3((arcPoints[0].x + arcPoints[1].x) / 2, (arcPoints[0].y + arcPoints[1].y) / 2, (arcPoints[0].z + arcPoints[1].z) / 2));
            arcPoints.Add(new Vector3(data.x, data.y, data.z));
        }
        positions = arcPoints.ToArray();
        lineRend.positionCount = positions.Length;
        lineRend.SetPositions(positions);
        updated = true;
    }
/*    public float id;
    public bool updated = false;
    public GameObject obj;
    [SerializeField] private static GameObject projectileObject;
    public void update(VisualizationData data) {
        obj.transform.position = new Vector3(data.x, data.y, data.z);
        obj.transform.rotation = Quaternion.Euler(data.rotX, data.rotY, data.rotZ);
        updated = true;
        obj.transform.localScale = new Vector3(data.scale, data.scale, data.scale);
    }
    public Visualization(float visualId, GameObject visualization) {
        obj = visualization;
        id = visualId;
    }
    public bool Equals(Visualization other) {
        return id == other.id;
    }*/

}
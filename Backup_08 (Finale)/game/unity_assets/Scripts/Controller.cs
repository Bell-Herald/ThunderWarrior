using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Controller : MonoBehaviour
{
    public static bool start = false;
    public GameObject trooper;
    public GameObject crate;
    public GameObject projectileObjectRed;
    public GameObject projectileObjectBlue;
    public GameObject projectileObjectGreen;
    public static Initiate mainTrooper;
    private List<Projectile> projectiles = new List<Projectile>();
    private List<Visualization> visualizations = new List<Visualization>();
    private List<Initiate> troopers = new List<Initiate>();
    [SerializeField] private GameObject message;
    [SerializeField] private GameObject recticle;
    [SerializeField] private GameObject Visualization;
    public void setFPS(int fps) {
        Application.targetFrameRate = fps;
    }
    public void buildTrooper(string dataString) {
        Initializer data = JsonUtility.FromJson<Initializer>(dataString);
        GameObject newTrooper = Instantiate(trooper, new Vector3(data.x + 1.3f / 2f, data.y + 0, data.z + 1.3f / 2f), Quaternion.Euler(0, data.rot, 0));
        if(data.name == data.username) mainTrooper = newTrooper.GetComponent<Initiate>();
        newTrooper.GetComponent<Initiate>().initialize(data);
        troopers.Add(newTrooper.GetComponent<Initiate>());
    }
    public void buildCrate(string dataString) {
        CrateInitiate data = JsonUtility.FromJson<CrateInitiate>(dataString);
        var newCrate = Instantiate(crate, new Vector3(data.x + data.w / 2, data.y + data.h / 2, data.z + data.d / 2), Quaternion.identity);
        newCrate.transform.localScale = new Vector3(data.w, data.h, data.d);
    }
    public void startGame() {
        start = true;
        recticle.SetActive(true);
        message.SetActive(false);
    }
    public void updateTrooper(string dataString) {
        TrooperData data = JsonUtility.FromJson<TrooperData>(dataString);
        if(!data.winner.Equals("") && recticle.activeSelf) {
            recticle.SetActive(false);
        }
        Initiate trooper = getTrooper(data.name);
        if(data.alive == true) {
            trooper.updateTrooper(data);
        } else {
            trooper.kill();
            if(trooper.name == mainTrooper.name) {
                foreach(Initiate killer in troopers) {
                    if(killer.name == data.killer) {
                        killer.activate();
                    }
                }
            }
        }
    }
    public Initiate getTrooper(string username) {
        foreach(Initiate trooper in troopers) {
            if(trooper.name == username) {
                return trooper;
            }
        }
        return troopers[0];
    }
    
    public void updateProjectiles(string dataString) {
        bool found = false;
        ProjectileData data = JsonUtility.FromJson<ProjectileData>(dataString);
        foreach(Projectile proj in projectiles) {
            if(proj.id == data.id) {
                proj.update(data);
                found = true;
                break;
            }
        }
        if(!found) {
            GameObject projectileObject;
            Initiate trooper = getTrooper(data.source);
            if(data.color == "Red") projectileObject = projectileObjectRed;
            else if(data.color == "Blue") projectileObject = projectileObjectBlue;
            else projectileObject = projectileObjectGreen;
            GameObject tempOb = Instantiate(projectileObject, new Vector3(data.x, data.y, data.z), Quaternion.Euler(data.rotX, data.rotY, data.rotZ));
            Projectile newProj = new Projectile(data.id, tempOb, trooper.gunBox, trooper.gunHeightBox);
            projectiles.Add(newProj);
            newProj.update(data);
        }
    }
    public void updateVisualization(string dataString) {
        bool found = false;
        VisualizationData data = JsonUtility.FromJson<VisualizationData>(dataString);
        foreach(Visualization vis in visualizations) {
            if(vis.id == data.id) {
                vis.update(data);
                found = true;
                return;//break;
            }
        }
        if(!found) {
            GameObject tempVisualization = Instantiate(Visualization, Vector3.zero, Quaternion.Euler(new Vector3(90, 0, 0)));
            visualizations.Add( new Visualization(tempVisualization, data) );
        }
    }
    public void finishGameObjects() {
        for(int i = projectiles.Count - 1; i >= 0; i --) {
            if(!projectiles[i].updated) {
                Destroy(projectiles[i].obj);
                projectiles.RemoveAt(i);
            } else {
                projectiles[i].updated = false;
            }
        }
        for(int i = visualizations.Count - 1; i >= 0; i --) {
            if(!visualizations[i].updated) {
                Destroy(visualizations[i].lineRend);
                visualizations.RemoveAt(i);
            } else {
                visualizations[i].updated = false;
            }
        }
    }
}
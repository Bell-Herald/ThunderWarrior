using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class Initiate : MonoBehaviour
{
    [SerializeField] private Animator anim;
    public GameObject cam;
    [SerializeField] private UserInput UserInput;
    [SerializeField] private SpriteRenderer HPBarCenter;
    [SerializeField] private SpriteRenderer HPBarBackground;
    [SerializeField] private TextMeshPro nameDisplay;
    [SerializeField] private GameObject personalHUD;

    [SerializeField] private GameObject dlt19Deluge;
    [SerializeField] private GameObject dlt19Epitome;
    [SerializeField] private GameObject dlt19Scarlet;

    [SerializeField] private GameObject e11Viper;
    [SerializeField] private GameObject e11Affluent;
    [SerializeField] private GameObject e11Twilight;

    [SerializeField] private GameObject t21Amaranthine;
    [SerializeField] private GameObject t21Shade;
    [SerializeField] private GameObject t21Vintage;

    [SerializeField] private GameObject helmetBasic;
    [SerializeField] private GameObject torsoBasic;
    [SerializeField] private GameObject legsBasic;
    [SerializeField] private GameObject leftArmBasic;
    [SerializeField] private GameObject rightArmBasic;
    [SerializeField] private GameObject helmetFestive;
    [SerializeField] private GameObject torsoFestive;
    [SerializeField] private GameObject legsFestive;
    [SerializeField] private GameObject leftArmFestive;
    [SerializeField] private GameObject rightArmFestive;

    [SerializeField] private GameObject helmetShadow;
    [SerializeField] private GameObject torsoShadow; 
    [SerializeField] private GameObject legsShadow;
    [SerializeField] private GameObject leftArmShadow;
    [SerializeField] private GameObject rightArmShadow;

    [SerializeField] private GameObject helmetSith;
    [SerializeField] private GameObject torsoSith;
    [SerializeField] private GameObject legsSith;
    [SerializeField] private GameObject leftArmSith;
    [SerializeField] private GameObject rightArmSith;
    
    [SerializeField] private GameObject orangeLaserSword;
    [SerializeField] private GameObject purpleLaserSword;
    [SerializeField] private GameObject redLaserSword;
    [SerializeField] private GameObject blueLaserSword;
    [SerializeField] private GameObject greenLaserSword;
    [SerializeField] private GameObject limeLaserSword;
    [SerializeField] private GameObject yellowLaserSword;
    [SerializeField] private GameObject cyanLaserSword;
    [SerializeField] private GameObject whiteLaserSword;

    [SerializeField] private GameObject orangeBlade;
    [SerializeField] private GameObject purpleBlade;
    [SerializeField] private GameObject redBlade;
    [SerializeField] private GameObject blueBlade;
    [SerializeField] private GameObject greenBlade;
    [SerializeField] private GameObject limeBlade;
    [SerializeField] private GameObject yellowBlade;
    [SerializeField] private GameObject cyanBlade;
    [SerializeField] private GameObject whiteBlade;

    public BoxCollider gunBox;
    public SphereCollider gunHeightBox;
    [SerializeField] private float salute;
    public float hp;
    public bool animatingWeight = false;
    private int gunWeight;
    private float gunWeightCount;


    public string name;
    private bool rotateHUD;
    void Update() {
        if(rotateHUD) personalHUD.transform.LookAt(Controller.mainTrooper.cam.transform);
        updateIdle();
    }
    private void updateIdle() {
        float change = Time.deltaTime * Random.value * 2;
        if(anim.GetInteger("topType") == 0) {
            salute += change;
            if(salute >= 15) {
                salute = 0;
                anim.SetTrigger("salute");
            }
        } else {
            salute -= change;
            if(salute < 5) {
                anim.ResetTrigger("salute");
            }
            if(salute < 0) salute = 0;
        }
    }
    
    private void cleanse(){
        UserInput.enabled = false;
        cam.SetActive(false);
        personalHUD.SetActive(true);
        rotateHUD = true;
    }
    private void refine() {
        personalHUD.SetActive(false);
        rotateHUD = false;
    }
    public void initialize(Initializer data) {
        name = data.username;
        hp = data.hp;
        nameDisplay.text = data.username;
        if(data.af.Equals(data.mainAf)) {
            nameDisplay.color = new Color(0, 0, 1);
        } else {
            nameDisplay.color = new Color(1, 0, 0);
        }
        if(data.name == data.username) {
            refine();
        } else {
            cleanse();
        }
        setEquipment(data.saber, data.gun, data.helmet, data.torso, data.legs, data.leftArm, data.rightArm);
    }
    private void setEquipment(string saber, string gun, string helmet, string torso, string legs, string leftArm, string rightArm) {
        gunBox = enable(gun, 
            new string[] {"DLT-19 Deluge", "DLT-19 Epitome", "DLT-19 Scarlet", "E-11 Viper","E-11 Affluent", "E-11 Twilight", "T-21 Amaranthine", "T-21 Shade", "T-21 Vintage"}, 
            new GameObject[] {dlt19Deluge, dlt19Epitome, dlt19Scarlet, e11Viper, e11Affluent, e11Twilight, t21Amaranthine, t21Shade, t21Vintage}
        ).GetComponent<BoxCollider>();
        enable(saber, 
            new string[] {"Coral Plasmablade", "Amethyst Plasmablade", "Garnet Plasmablade", "Tanzanite Plasmablade", "Emerald Plasmablade", "Peridot Plasmablade", "Topaz Plasmablade", "Boracite Plasmablade", "Alabaster Plasmablade"},
            new GameObject[] {orangeLaserSword, purpleLaserSword, redLaserSword, blueLaserSword, greenLaserSword, limeLaserSword, yellowLaserSword, cyanLaserSword, whiteLaserSword}
        );
        enable(saber, 
            new string[] {"Coral Plasmablade", "Amethyst Plasmablade", "Garnet Plasmablade", "Tanzanite Plasmablade", "Emerald Plasmablade", "Peridot Plasmablade", "Topaz Plasmablade", "Boracite Plasmablade", "Alabaster Plasmablade"},
            new GameObject[] {orangeBlade, purpleBlade, redBlade, blueBlade, greenBlade, limeBlade, yellowBlade, cyanBlade, whiteBlade}
        );
        enable(helmet,
            new string[] {"Thunder Warrior Helmet", "Festive Helmet", "Shadow Helmet", "Sith Helmet"}, 
            new GameObject[] {helmetBasic, helmetFestive, helmetShadow, helmetSith}
        );
        enable(torso,
            new string[] {"Thunder Warrior Torso", "Festive Torso", "Shadow Torso", "Sith Torso"}, 
            new GameObject[] {torsoBasic, torsoFestive, torsoShadow, torsoSith}
        );
        enable(legs,
            new string[] {"Thunder Warrior Legs", "Festive Legs", "Shadow Legs", "Sith Legs"}, 
            new GameObject[] {legsBasic, legsFestive, legsShadow, legsSith}
        );
        enable(leftArm,
            new string[] {"Thunder Warrior Left", "Festive Left", "Shadow Left", "Sith Left"}, 
            new GameObject[] {leftArmBasic, leftArmFestive, leftArmShadow, leftArmSith}
        );
        enable(rightArm,
            new string[] {"Thunder Warrior Right", "Festive Right", "Shadow Right", "Sith Right"}, 
            new GameObject[] {rightArmBasic, rightArmFestive, rightArmShadow, rightArmSith}
        );
    }
    private GameObject enable(string name, string[] names, GameObject[] obs) {
        GameObject found = obs[0];
        for(var i = names.Length - 1; i >= 0; i --) {
            if(names[i] == name) {
                obs[i].SetActive(true);
                found = obs[i];
            } else {
                Destroy(obs[i]);
            }
        }
        return found;
    }
    public void updateTrooper(TrooperData data) {
        setPosRot(data);
        setAnimation(data);
        setHPBar(data);
    }
    public void kill() {
        if(gameObject.activeSelf) {
            rotateHUD = false;
            UserInput.enabled = false;
            gameObject.SetActive(false);
        }
    }
    public void activate() {
        if(!cam.activeSelf) {
            cam.SetActive(true);
            rotateHUD = false;
            personalHUD.SetActive(false);
        }
    } 
    private void setPosRot(TrooperData data) {
        transform.position = modifyPosition(new Vector3(data.x, data.y, data.z));
        transform.rotation = Quaternion.Euler(0, data.rot, 0);
        cam.transform.position = new Vector3(data.cameraX, data.cameraY, data.cameraZ);
        cam.transform.rotation = Quaternion.Euler(data.cameraRotX, data.cameraRotY, data.cameraRotZ);
    }
    private void setHPBar(TrooperData data) {
        float max = 1.5f;
        float width = data.hpCurrent / data.hpMax;
        float r = data.hpR / 255;
        float g = data.hpG / 255;
        float b = data.hpB / 255;
        HPBarCenter.color = new Color(r,g,b);
        HPBarCenter.transform.localScale = new Vector3(width * max, 0.25f, 0.25f);
        HPBarCenter.transform.localPosition = new Vector3((max - (width * max)) / 4,0,0);
        HPBarBackground.transform.localScale = new Vector3(max - (width * max), 0.25f, 0.25f);
        HPBarBackground.transform.localPosition = new Vector3((width * max) / -4,0,0);
    }
    private void setAnimation(TrooperData data) {
        if(data.moveType == 3 && anim.GetInteger("moveType") == 4) {
            anim.SetBool("fallToJump", true);
        } else {
            anim.SetBool("fallToJump", false);
        }
        anim.SetInteger("moveType", data.moveType);
        anim.SetInteger("topType", data.topType);
        setGunWeight(data.gunWeight);
        setLeftHand(data.leftHandWeight);

    }
    private void setLeftHand(float leftHandWeight) {
        anim.SetLayerWeight(4, leftHandWeight);
    }
    private void setGunWeight(int newGunWeight) {
        if(!animatingWeight) {
            if(gunWeight == newGunWeight) {
                gunWeightCount += Time.deltaTime;
            } else {
                gunWeightCount = 0;
                gunWeight = newGunWeight;
            }
            if(gunWeightCount >= 3) {
                anim.SetLayerWeight(2, newGunWeight);
                anim.SetLayerWeight(3, Mathf.Abs(1 - newGunWeight));
            }
        }
    }
    private Vector3 modifyPosition(Vector3 position) {
        position.x += 1.3f / 2f;
        position.y += 0;
        position.z += 1.3f / 2f;
        return position;
    }
}
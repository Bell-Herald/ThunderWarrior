using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SwitchToGun : StateMachineBehaviour
{
    Initiate trooper;
    // OnStateEnter is called when a transition starts and the state machine starts to evaluate this state
    override public void OnStateEnter(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        if(layerIndex != 1) return;
        if(!trooper) trooper = animator.gameObject.GetComponent<Initiate>();
        trooper.animatingWeight = true;
        animator.SetLayerWeight(3, 0);
        animator.SetLayerWeight(2, 1);
    }

    // OnStateUpdate is called on each Update frame between OnStateEnter and OnStateExit callbacks
    override public void OnStateUpdate(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        if(layerIndex != 1) return;
        if(stateInfo.normalizedTime <= 1) {
            float swordWeight = getWeight(stateInfo, 0.1f, 0.125f, 0);
            float gunWeight = getWeight(stateInfo, 0.575f, 0.625f, 1);
            animator.SetLayerWeight(3, swordWeight);
            animator.SetLayerWeight(2, gunWeight);
            trooper.animatingWeight = true;
        } else {
            trooper.animatingWeight = false;
        }

    }
    
    private float getWeight(AnimatorStateInfo stateInfo, float start, float end, float baseVal) {
        float weight = baseVal;
        if(stateInfo.normalizedTime > start && stateInfo.normalizedTime <= end) {
            weight = baseVal - ((stateInfo.normalizedTime - start) * (1 / (end - start)));
        } else if(stateInfo.normalizedTime > end) {
            weight = 1 - baseVal;
        }
        return Mathf.Abs(weight);
    }

    // OnStateExit is called when a transition ends and the state machine finishes evaluating this state
    override public void OnStateExit(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    {
        if(layerIndex != 1) return;
        animator.SetLayerWeight(3, 1);
        animator.SetLayerWeight(2, 0);
        trooper.animatingWeight = false;
    }

    // OnStateMove is called right after Animator.OnAnimatorMove()
    //override public void OnStateMove(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that processes and affects root motion
    //}

    // OnStateIK is called right after Animator.OnAnimatorIK()
    //override public void OnStateIK(Animator animator, AnimatorStateInfo stateInfo, int layerIndex)
    //{
    //    // Implement code that sets up animation IK (inverse kinematics)
    //}
}

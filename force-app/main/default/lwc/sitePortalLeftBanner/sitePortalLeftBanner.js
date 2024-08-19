import { LightningElement, track } from 'lwc';
//import hydeLoginCaption from '@salesforce/label/c.hydeLoginCaption5';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class SitePortalLeftBanner extends LightningElement {  
    //loginText = hydeLoginCaption;
    @track isDesktopOrTablet;
  
    connectedCallback() {
      this.isDesktopOrTablet = FORM_FACTOR !== 'Small' ? true : false;
    }
  }
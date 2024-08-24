import { LightningElement, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class SitePortalLeftBanner extends LightningElement {  
  loginText = '';
    @track isDesktopOrTablet;
  
    connectedCallback() {
      this.isDesktopOrTablet = FORM_FACTOR !== 'Small' ? true : false;
    }
  }
import { LightningElement } from 'lwc';
import siteResource from '@salesforce/resourceUrl/footerlogo';
export default class FooterComponent extends LightningElement {
    logo = siteResource + '/logoimagefooter/logo.png';
}
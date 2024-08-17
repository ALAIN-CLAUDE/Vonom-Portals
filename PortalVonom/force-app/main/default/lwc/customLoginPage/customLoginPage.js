import { LightningElement,track } from 'lwc';
import siteResource from '@salesforce/resourceUrl/customSiteImages';
import doLogin from '@salesforce/apex/CommunityAuthController.doLogin';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class CustomLoginPage extends NavigationMixin(LightningElement) {

    @track username=null;
    @track password=null;
    @track errorCheck;
    @track errorMessage;
    isLoading=false;
    errorBorderEmail='';
    errorBorderPass='';

    homeUrl = siteResource + '/customSite/home.png';
    login = siteResource + '/customSite/login.png';
    logo = siteResource + '/customSite/logo.png';

    connectedCallback(){

    var meta = document.createElement("meta");
    meta.setAttribute("name", "viewport");
    meta.setAttribute("content", "width=device-width, initial-scale=1.0");
    document.getElementsByTagName('head')[0].appendChild(meta);
    }

    handleUserNameChange(event){
        this.username = event.target.value;
        console.log('this.username : ',this.username);
        this.errorBorderEmail= (this.username!=null || this.username!='')?"":this.errorBorderEmail
    }

    handlePasswordChange(event){
        this.password = event.target.value;
        console.log('this.password : ',this.password);
        this.errorBorderPass= (this.password!=null || this.password!='')?"":this.errorBorderPass

    }

    handleLogin(event){
        this.isLoading=true;
        console.log('this.username : ',this.username);
        console.log('this.password : ',this.password);

       if((this.username!=null || this.username!=undefined) && (this.password!=null || this.password!=undefined)){
        console.log('OUTPUT : ma chala');
        event.preventDefault();

        doLogin({ username: this.username, password: this.password })
            .then((result) => {
                console.log('OUTPUT : ',JSON.stringify(result));
                this.isLoading=false;
                
                window.location.href = result;
            })
            .catch((error) => {
                this.isLoading=false;
                this.error = error;      
                this.errorCheck = true;
                this.errorMessage = error.body.message;
                console.log('this.errorMessage : ',this.errorMessage);
                this.template.querySelector('c-custom-toast').showToast('error', this.errorMessage);
            });

        }
        else{
            this.errorBorderEmail=(this.username==null || this.username=='')?"border:1px solid red !Important;":"";
            this.errorBorderPass=(this.password==null || this.password=='')?"border:1px solid red !Important;":"";
            this.template.querySelector('c-custom-toast').showToast('error', 'Please fill username and password');
            this.isLoading=false;
        }

    }

    navigateToSelfRegister() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/SelfRegister'
            }
        });
    }

}
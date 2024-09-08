import { LightningElement, track } from 'lwc';
import siteResource from '@salesforce/resourceUrl/customSiteImages';
import resetPassword from '@salesforce/apex/CommunityAuthController.resetPasswordLink';
import { NavigationMixin } from 'lightning/navigation';

export default class CustomForgetPasswordPage extends NavigationMixin(LightningElement) {
    logo = siteResource + '/customSite/logo.png';

    email;
    @track isLoading = false;
    isValid = false;
    displayMessage = '';
    showError = '';

    toastTheme = 'slds-notify slds-notify_toast';
    toastSuccess = false;
    toastError = false;
    toastInfo = false;
    toastWarning = false;
    isCssLoaded = false;
    defaultView = true;

    handleInputChange(event) {
        if (event.target.name === 'email') {
            // getting value from email input field
            this.email = event.target.value;
        }
    }

    handleResetPassword(event) {
    console.log('in handleResetPassword');
      let checkValidity = false;
      this.template.querySelectorAll('lightning-input').forEach(element => {
        checkValidity = element.reportValidity();
        if (checkValidity == false) {
          return checkValidity;
        }
      });
      if (checkValidity) {
        this.isLoading = true;
        this.hydeResetPassword();
      }
      
    }

    navigateToLogin() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/'
            }
        });
    }

    hydeResetPassword() {
      console.log('this.email ',this.email);
        resetPassword({ inputemail: this.email })
            .then((result) => {
                this.isLoading = false;
                if (result === 'LoginResetSuccess') {
                    this.toastTheme = 'slds-notify slds-notify_toast slds-theme_success';
                    this.toastSuccess = true;
                    this.toastError = false;
                    this.defaultView = false;
                    this.displayMessage = 'We have sent an email with a link to reset your password. Check your email and deactivate the link before it expires in 24 hours. If this email expires, you will need to start the reset password process again';
                    this.template.querySelector('c-custom-toast').showToast('success', this.displayMessage);
                //    this.displayFocus();
               //     this.autoCloseToast();
                } else if (result === 'invalidUserName') {
                    this.toastSuccess = false;
                    this.toastTheme = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastError = true;
                    this.defaultView = false;
                    this.displayMessage = 'This email address is not associated with any account. Please call us on 0800 3 232 2223 Or SignUp';
                    this.template.querySelector('c-custom-toast').showToast('error', this.displayMessage);
                 //   this.displayFocus();
                  //  this.autoCloseToast();
                } else if (result === 'UserLockedOut') {
                    this.toastSuccess = false;
                    this.toastError = true;
                    this.defaultView = false;
                    this.toastTheme = 'slds-notify slds-notify_toast slds-theme_error';
                    this.displayMessage = 'Your account has been locked. Please contact customer service for assistance.';
                    this.template.querySelector('c-custom-toast').showToast('error', this.displayMessage);
                //    this.displayFocus();
                //    this.autoCloseToast();
                }
            })
            .catch((error) => {
                this.isLoading = false;
                this.toastSuccess = false;
                this.toastError = true;
                this.toastTheme = 'slds-notify slds-notify_toast slds-theme_error';
                this.displayMessage = 'An error occurred while trying to reset your password. Please try again later.';
                this.template.querySelector('c-custom-toast').showToast('error', this.displayMessage);
              //  this.displayFocus();
              //  this.autoCloseToast();
            });
    }

    displayFocus() {
       // this.template.querySelector(".focusOnlyInput").focus();
    }

    closeToast(event) {
        this.displayMessage = '';
    }

    autoCloseToast(event) {
        setTimeout(() => { 
            this.displayMessage = '';
        }, 10000);
    }
}

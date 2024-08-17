import { LightningElement, track } from 'lwc';
import siteResource from '@salesforce/resourceUrl/customSiteImages';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import isEmailExist from '@salesforce/apex/CommunityAuthController.isEmailExist';
import registerUser from '@salesforce/apex/CommunityAuthController.registerUser';

export default class CustomSignUpPage extends NavigationMixin(LightningElement) {

    homeUrl = siteResource + '/customSite/home.png';
    login = siteResource + '/customSite/login.png';
    logo = siteResource + '/customSite/logo.png';

    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track organization = '';
    @track rolevalue = 'Author';
    @track abstract = '';
    @track terms = false;

    @track errorBorderFirstName = '';
    @track errorBorderLastName = '';
    @track errorBorderEmail = '';
    @track errorBorderOrganization = '';
    @track errorBorderAbstract = '';

    @track showTermsAndConditionsLoading = false;
    @track emailError = '';

    get options() {
        return [
            { label: 'Author', value: 'Author' },
            { label: 'Reviewer', value: 'Reviewer' },
            { label: 'Editor', value: 'Editor' },
        ];
    }

    get isAuthor() {
        return this.rolevalue === 'Author';
    }

    handleChange(event) {
        const field = event.target.name;
        const value = event.target.value;

        switch (field) {
            case 'firstName':
                this.firstName = value;
                this.errorBorderFirstName = this.firstName ? '' : 'border: 1px solid red;';
                break;
            case 'lastName':
                this.lastName = value;
                this.errorBorderLastName = this.lastName ? '' : 'border: 1px solid red;';
                break;
            case 'email':
                this.email = value;
                this.errorBorderEmail = this.email ? '' : 'border: 1px solid red;';
                break;
            case 'organization':
                this.organization = value;
                this.errorBorderOrganization = this.organization ? '' : 'border: 1px solid red;';
                break;
            case 'abstract':
                this.abstract = value;
                this.errorBorderAbstract = this.isAuthor && !this.abstract ? 'border: 1px solid red;' : '';
                break;
            case 'terms':
                this.terms = event.target.checked;
                break;
            case 'role':
                this.rolevalue = value;
                break;
            default:
                break;
        }
    }

    async handleRegister(event) {
        event.preventDefault();

        let hasError = false;

        // Validate required fields
        if (!this.firstName) {
            this.errorBorderFirstName = 'border: 1px solid red;';
            hasError = true;
        }
        if (!this.lastName) {
            this.errorBorderLastName = 'border: 1px solid red;';
            hasError = true;
        }
        if (!this.email) {
            this.errorBorderEmail = 'border: 1px solid red;';
            hasError = true;
        }
        if (!this.organization) {
            this.errorBorderOrganization = 'border: 1px solid red;';
            hasError = true;
        }
        if (this.isAuthor && !this.abstract) {
            this.errorBorderAbstract = 'border: 1px solid red;';
            hasError = true;
        }

        if (hasError) {
            return; // Stop processing if there are errors
        }

        this.showTermsAndConditionsLoading = true;
        if(!this.terms){
            this.template.querySelector('c-custom-toast').showToast('error', 'Please check the terms and policy');
            this.showTermsAndConditionsLoading = false;
            return;
        }

        const emailCheck = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email);

        if (!emailCheck) {
            this.emailError = 'Please enter a valid email address';
            this.errorBorderEmail = 'border: 1px solid red;';
            this.template.querySelector('c-custom-toast').showToast('error', 'Please enter a valid email address');
            this.showTermsAndConditionsLoading = false;
            return;
        }

        try {
            const emailExists = await isEmailExist({ username: this.email });
            if (emailExists) {
                this.emailError = 'Your email already exists somewhere on the Salesforce Ecosystem.';
                this.showTermsAndConditionsLoading = false;
                this.template.querySelector('c-custom-toast').showToast('error', this.emailError);
                return;
            }

            await registerUser({
                firstName: this.firstName,
                lastName: this.lastName,
                username: this.email,
                email: this.email,
                communityNickname: this.firstName,
                password: null, // Assuming password is not required here
                organization: this.organization,
                role: this.rolevalue,
                abstractval: this.abstract
            });

            this.template.querySelector('c-custom-toast').showToast('success', 'Registered Successfully, Confirmation Email has been sent');
            this.navigateToLogin();

        } catch (error) {
            this.template.querySelector('c-custom-toast').showToast('error', error.body.message);
        } finally {
            this.showTermsAndConditionsLoading = false;
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

    handleTermsAndConditionsChange(event) {
        this.terms = event.target.checked;
    }
}
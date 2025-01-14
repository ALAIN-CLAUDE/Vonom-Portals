<template>
    <article class="slds-card slds-card_boundary disclosure-cards">
        <lightning-spinner if:true={loading} class="details-box" variant="brand" alternative-text="Loading..."
            size="medium">
        </lightning-spinner>

        <div class="slds-theme_shade slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-standard-account" title={cardTitle}>
                        <lightning-icon icon-name={cardIcon} size="small"></lightning-icon>
                        <span class="slds-assistive-text">{cardTitle}</span>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        <a onclick={navigateToAll} class="slds-card__header-link slds-truncate" title={cardTitle}>
                            <span>{cardTitle}</span> <span if:false={error}> ({profileAmt})</span>
                        </a>
                    </h2>
                </div>
                <div>
                    <div if:false={isSignature}>
                        <lightning-button class="slds-no-flex" onclick={handleNewClick} disabled={isNewDisabled} aria-haspopup="dialog" label="New">
                        </lightning-button>
                    </div>
                </div>
            </header>
        </div>

        <div if:false={noResults}>
            <div if:false={error}>
                <div
                    class="slds-card__body slds-card__body_inner slds-theme_default slds-var-m-vertical_medium slds-var-p-left_large">
                    <template for:each={relatedListsData} for:item="data" for:index="idx">
                        <c-display-data key={data.id} index={idx} related-lists-data={data}
                            signature-card={isSignature}></c-display-data>
                    </template>
                </div>
                <footer class="slds-card__footer slds-theme_default slds-m-top_none slds-var-p-vertical_large">
                    <a class="slds-card__footer-action" onclick={navigateToAll}>View All</a>
                </footer>
            </div>
        </div>

        <div if:true={error}
            class="slds-card__body slds-m-bottom_none slds-var-p-left_small slds-var-p-bottom_small slds-m-vertical_none"
            style="display: flex">
            <p class="slds-text-color_error slds-var-m-right_xx-small">
                {cardTitle} could not be loaded at this time.
            </p>
            <p class="slds-text-link_faux color-blue" onclick={getData}>
                Try Again?
            </p>
        </div>
    </article>
</template>
,,,.................................................................................................................................
import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { getRecord } from 'lightning/uiRecordApi'
import { refreshApex } from '@salesforce/apex';

import globalStyles from '@salesforce/resourceUrl/globalStyles';
import { loadStyle } from 'lightning/platformResourceLoader';
import { NavigationMixin } from 'lightning/navigation';
import DisclosureAddInventorModal from 'c/disclosureAddInventorModal';
import { getObjectInfo } from 'lightning/uiObjectInfoApi'
import DISCLOSURE_INVENTOR_OBJECT from '@salesforce/schema/DisclosureInventor__c'

const INVENTOR_FIELDS = ['DisclosureInventor__c.Contact__c', 'DisclosureInventor__c.Signed_Status__c', 'DisclosureInventor__c.PrimaryInventor__c', 'DisclosureInventor__c.Signed_Disclosure_Date__c'];

export default class DisclosureRelatedCards extends NavigationMixin(LightningElement) {
    // Target Configs API
    @api cardIcon;
    @api cardTitle;
    @api relatedListId;

    // Disclosure Record Id
    @api recordId;

    // Custom Variables
    loading;
    noResults = true;
    profileAmt;
    relatedListsData;
    error;
    isSignature = false;
    createableInventor = false;
    isApproved = false

    determineCardType() {
        if (this.cardTitle === 'Signature' || this.cardTitle === 'Signatures') {
            this.isSignature = true;
        }
    }


    // Can Create new Inventor
    @wire(getObjectInfo, { objectApiName: DISCLOSURE_INVENTOR_OBJECT })
    disclosureInventorInfo({ data, error }) {
        if (data) {
            console.log(data.fields)
            this.createableInventor = data.fields.Contact__c?.createable === true
            console.log(`createableInventor: ${this.createableInventor}`)
        } else if (error) {
            this.error = 'Unknown error';
        }
    }

    @wire(getRecord, {
        recordId: '$recordId',
        fields: ['Disclosure__c.Id', 'Disclosure__c.Status__c']
    })
    handleDisclosureGetRecord({ data, error }) {
        if (data) {
            this.isApproved = data.fields.Status__c.value === 'Approved' ? true : false
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: '$relatedListId',
        fields: INVENTOR_FIELDS,
    })
    listInfo({ error, data }) {
        this.loading = true;
        this.determineCardType();
        if (data) {
            if (data.records.length > 0) {
                this.noResults = false;
            }
            this.relatedListsData = data.records;
            this.loading = false;
            this.profileAmt = this.relatedListsData.length > 3 ? '3+' : this.relatedListsData.length;
            this.error = undefined;
        } else if (error) {
            this.error = 'Unknown error';
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                this.error = error.body.message;
            }
            console.log("ERROR: ", this.error);
            this.relatedListsData = undefined;
            this.noResults = true;
            this.loading = false;
        }
    }

    get isNewDisabled() {
        console.log(`canCreateInventor: ${this.createableInventor}`)
        console.log(`isApproved: ${this.isApproved}`)
        return !(this.isApproved && this.createableInventor)
    }

    async handleNewClick() {
        const result = await DisclosureAddInventorModal.open({
            // `label` is not included here in this example.
            // it is set on lightning-modal-header instead
            size: 'large',
            description: 'Accessible description of modal\'s purpose',
            recordId: this.recordId
            // content: 'Passed into content api',
        });
        console.log(result)
        if (result === 'Success') {
            // Refresh LWC data when added
            refreshApex(this.relatedListsData) // Does not work? Next line is workaround
            // eslint-disable-next-line no-restricted-globals
            location.reload()
        }
    }

    navigateToAll() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Disclosure__c',
                relationshipApiName: this.relatedListId,
                actionName: 'view'
            },
        });
    }

    connectedCallback() {
        loadStyle(this, globalStyles);
    }
}

////////////////////////////////////////////////////////////////////////////////////////
<template>

  <article class="slds-card bg-grey_light">
    <lightning-spinner if:true={loading} class="details-box" variant="brand" alternative-text="Loading..."
      size="medium">
    </lightning-spinner>

    <div slot="title"
      class="flex-align-center slds-var-p-vertical_x-large slds-var-p-left_medium slds-var-p-left_medium">
      <lightning-icon size="small" class="slds-m-right_small" icon-name="standard:record">
      </lightning-icon>
      <h3 class="slds-text-heading_small"><strong>MIT HR Appointment History <span
            if:false={error}>({profileAmt})</span></strong></h3>
    </div>
    <div if:false={loading}>
      <div if:false={noResults}>
        <div if:false={error}>
          <div
            class="slds-card__body slds-card__body_inner slds-m-vertical_none slds-var-p-vertical_small slds-theme_default">
            <template for:each={profile} for:item="val" for:index="idx">
              <c-display-data key={val.mitid} index={idx} app-data={val}></c-display-data>
            </template>
          </div>
          <footer class="slds-card__footer slds-theme_default slds-m-top_none slds-var-p-vertical_large">
            <a class="slds-card__footer-action" onclick={navigateToAll}>View All</a>
          </footer>
        </div>
      </div>
      <div if:true={error}
        class="slds-card__body slds-m-bottom_none slds-var-p-left_small slds-var-p-bottom_small slds-m-vertical_none"
        style="display: flex">
        <p class="slds-text-color_error slds-m-right_xx-small">
          MIT HR Appointment History could not be loaded at this time.
        </p>
        <p class="slds-text-link_faux color-blue" onclick={getApptHist}>
          Try Again?
        </p>
      </div>
    </div>
  </article>

</template>
/////////////////////////////////////////////////////////////////////////////////

import { LightningElement, api, wire, track } from 'lwc'
import restGet from '@salesforce/apex/AwsApiCall.restGet'
import { NavigationMixin } from 'lightning/navigation'
import { getFieldValue, getRecord } from 'lightning/uiRecordApi'
import { invokeWorkspaceAPI } from 'c/workspaceApiUtils'
import { HISTORY_ACCOUNT_FIELDS } from 'c/utils'

export default class AppointmentHistory extends NavigationMixin(
    LightningElement
) {
    @api recordId
    @api mitIdField

    @track error
    @track dynamicProfile
    @track profile
    @track noResults = false
    loading = true
    profileAmt = 0
    record

    @wire(getRecord, { recordId: '$recordId', fields: HISTORY_ACCOUNT_FIELDS })
    async handleGetRecord(record) {
        if (record.data) {
            this.record = record
            await this.getApptHist()
        }
        if (record.error) {
            this.error = true
        }
    }

    get mitId() {
        if (this.record) {
            return getFieldValue(this.record.data, this.mitIdField)
        }
        return null
    }

    getApptHist = async () => {
        this.loading = true
        this.error = false
        this.profile = null
        this.noResults = false
        this.profileAmt = 0
        try {
            const apiName = 'appointmentHistoryApi'
            const res = await restGet({
                api: apiName,
                resource: `/histories/${this.mitId}`
            })
            if (res) {
                this.profile = JSON.parse(res)
                if (this.profile.message) {
                    console.error(this.profile.message)
                    this.error = true
                } else if (this.profile.length === 0) {
                    this.noResults = true
                } else {
                    this.profileAmt =
                        this.profile.length > 3 ? '3+' : this.profile.length
                }
            }
        } catch (error) {
            console.error(error)
            this.loading = false
            this.profile = null
            this.error = true
        } finally {
            this.loading = false
        }
    }

    navigateToAll() {
        invokeWorkspaceAPI('isConsoleNavigation').then((isConsole) => {
            if (isConsole) {
                invokeWorkspaceAPI('getFocusedTabInfo').then((focusedTab) => {
                    invokeWorkspaceAPI('openSubtab', {
                        parentTabId: focusedTab.tabId,
                        pageReference: {
                            type: 'standard__navItemPage',
                            attributes: {
                                apiName: 'MIT_Appointment_History'
                            },
                            state: {
                                c__name: this.record.data.fields.Name.value,
                                c__url: window.location.href,
                                c__mitid: this.mitId,
                                c__personDetailsTabId: focusedTab.tabId
                            }
                        }
                    }).then((tabId) => {
                        invokeWorkspaceAPI('setTabLabel', {
                            tabId: tabId,
                            label: 'Appointment History'
                        })

                        invokeWorkspaceAPI('setTabIcon', {
                            tabId: tabId,
                            icon: 'standard:record',
                            iconAlt: 'Appointment History'
                        })
                    })
                })
            }
        })
    }
}
//////////////////////////////////////////////////////////////////
         <!-- Display error data here -->
                <div class="slds-p-around_medium">
                    <article class="slds-card slds-card_boundary cardborderstyling">
                        <lightning-spinner if:true={showLoading} class="details-box" variant="brand"
                            alternative-text="Loading..." size="medium">
                        </lightning-spinner>
                        <div class="slds-page-header slds-page-header_related-list cardheadercss">
                            <div class="slds-page-header__row slds-p-top_small">
                                <div class="slds-page-header__col-title">
                                    <div class="slds-media">
                                        <div class="slds-media__body">
                                            <div class="demo-only slds-size_3-of-4">
                                                <div class="slds-media slds-media_small">
                                                    <div class="slds-media__figure">
                                                        <span class="slds-avatar slds-avatar_small">
                                                            <lightning-icon class="custom-icon-background"
                                                                icon-name="standard:first_non_empty"
                                                                size="small"></lightning-icon>
                                                        </span>
                                                    </div>
                                                    <div
                                                        class="slds-media__body slds-p-top_xx-small slds-p-left_x-small">
                                                        <h1 class="slds-card__header-title">
                                                            {errorTitleWithCount}
                                                        </h1>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="slds-grid">
                            <div class="slds-col slds-size_12-of-12">
                                <template if:true={isDataPresent}>
                                    <lightning-datatable data={errorData} hide-checkbox-column columns={columns}
                                        key-field="Field"></lightning-datatable>
                                </template>
                                <template if:false={isDataPresent}>
                                    <p class="slds-text-align_center">No errors to display.</p>
                                </template>
                            </div>
                        </div>
                    </article>
                </div>
//////////////////////////////////////////////////////////////////////////////////////////

.custom-icon-background {
    --slds-c-icon-color-background: rgb(232, 2, 30);
}

.cardheadercss {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: var(--lwc-borderWidthThin) solid rgb(201, 201, 201);
    height: 4rem;
}

.cardborderstyling {
    --slds-c-card-radius-border: 7px;
    --slds-c-card-color-border: rgb(201, 201, 201);
    border-width: var(--slds-c-card-sizing-border, var(--sds-c-card-sizing-border, var(--lwc-borderWidthThin, 1px)));
    border-style: solid;

}

.custom-datatable thead th {
    font-weight: var(--lwc-fontWeightBold, 700);
}

.modalheadercss {
    background-color: rgb(232, 2, 30);
}
////////////////////////////////////////////////////////

import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRelatedFilesByAgreementRecId from '@salesforce/apex/FileRepository.getRelatedFilesByAgreementRecId';
import getFileContentVersionsByDocumentIds from '@salesforce/apex/FileRepository.getFileContentVersionsByDocumentIds';
import { fileIcon, getFileSize, sortBy, asStringIgnoreCase} from 'c/utils';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ContentVersion_OBJECT from '@salesforce/schema/ContentVersion';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

//Using the schema '@salesforce/schema/Forrester_SHIR_AGREEMENT_VIEW__x.TYPE_DESCRIPTION__c'
//We sometimes get errors, when clicking on tabs before the page have loaded.
//Random failures where [Forrester_SHIR_AGREEMENT_VIEW__c] is queried instead of [Forrester_SHIR_AGREEMENT_VIEW__x]
const AGREEMENT_FIELDS = [
    'Forrester_SHIR_AGREEMENT_VIEW__x.TYPE_DESCRIPTION__c',
    'Forrester_SHIR_AGREEMENT_VIEW__x.AGREEMENT_RECID__c'
]

const columns = [
    {
        label: 'File Name',
        fieldName: 'fileUrl',
        type: 'url',
        sortable: true,
        typeAttributes: {
            label: {
                fieldName: 'Title'
            }
        },
        cellAttributes: { iconName: { fieldName: 'dynamicIcon' } }
    },
    {
        label: 'Document Type',
        fieldName: 'renderedClassification',
        sortable: true,
    },
    {
        label: 'Created Date',
        sortable: true,
        fieldName: 'CreatedDate',
        type: "date",
        typeAttributes: {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    },
    {
        label: 'Uploaded By',
        sortable: true,
        fieldName: 'CreatedBy',
        type: "text",
    },
];
export default class RelatedDocuments extends NavigationMixin(LightningElement) {
    @api recordId;
    sortDirection = 'asc';
    fileSet = [];
    fileSetCount = '';
    fileSetData = [];
    fileIds = [];

    loading = true;
    wiredLoading = true;
    objectInfoLoading = true;
    documentTypeLoading = true;

    noFiles = false;
    loadError = false;
    showModal = false;
    documentTypeOptions = [];
    selectedDocumentTypeOptions;
    contentVersionRecordTypeId;
    agreementDataSubTypeValue;
    agreementRecId;
    typeDescription;

    contentVersionRecordTypeData

    get showLoading() {
        return this.wiredLoading  || this.objectInfoLoading || this.documentTypeLoading || this.loading
    }
    @wire(getRelatedFilesByAgreementRecId, { recordId: '$recordId'})
    async relatedAgreement(result) {
        this.loading = true;
        this.wiredResult = result;
        const { error, data } = result;
        if (data) {
            this.fileIds = data;
            this.generateFileData();
        } else if (error) {
            console.log(error);
            console.log(error.body.message);
        }
        this.onWiredEvent('relatedAgreement')
    }



    generateFileData = async () => {
        this.loading = true;
        this.fileSet = [];
        this.fileSetData = [];
        this.loadError = false;
        this.noFiles = false;

        try {

            const contentDocumentIds = this.fileIds.map(x => x.ContentDocumentId);
            this.fileSet = await getFileContentVersionsByDocumentIds({ contentDocumentIds: contentDocumentIds });

            this.fileSetCount = this.fileSet.length;

            this.fileSetData = await Promise.all(
                this.fileSet.map(async (x) => {
                    x.Type = `${x.RecordType.Name}`
                    x.Title = x.Title,
                    x.CreatedBy = x.CreatedBy.Name
                    x.ContentSize = getFileSize(x.ContentSize)
                    x.fileUrl = await this.navigateToPreviewFileUrl(x.ContentDocumentId)
                    x.dynamicIcon = fileIcon(x.FileExtension)
                    x.renderedClassification = x.Document_Classification_Label
                    return x
                })
            )

            if (this.fileSetData.length === 0) {
                this.noFiles = true;
                this.loading = false;
                return;
            }
            this.template.querySelector('lightning-datatable').columns = columns;
        } catch (error) {
            console.error(`%c [ERROR]`, `color: red`, error);
            this.loadError = true;
        }
        this.loading = false;
    }

    onHandleSort(event) {
        let { fieldName: sortedBy, sortDirection } = event.detail;
        const tempSorting = [...this.fileSetData]

        if (sortedBy === 'fileUrl') {
            sortedBy = 'Title'
        }

        tempSorting.sort(sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1, (x) => asStringIgnoreCase(x)));
        this.fileSetData = tempSorting;
        this.sortDirection = sortDirection;

        if (sortedBy === 'Title') {
            sortedBy = 'fileUrl'
        }

        this.sortedBy = sortedBy;
    }

   //function to generate the url for file preview
   async navigateToPreviewFileUrl(id) {
    const url = await this[NavigationMixin.GenerateUrl]({
        type: "standard__namedPage",
        attributes: {
            pageName: "filePreview"
        },
        state: {
            selectedRecordId: id
        }
    });
    return url
}

get documentCardTitleWithCount() {
    return "All Documents (" + this.fileSet.length + ")"
}

    get datatableHeight() {
        if ( this.fileSet.length >= 8) {
            return 'height: 250px;';
        }
        return 'height: 100%';
    }

    handleUploadModal() {
        this.showModal = true;
    }


    handleCancelModal() {
        this.showModal = false;
    }


    @wire(getRecord, { recordId: '$recordId', fields: AGREEMENT_FIELDS })
    wiredRecord({ error, data }) {
        this.wiredLoading = true;
        if (data) {
            this.typeDescription = data.fields.TYPE_DESCRIPTION__c.value;
            this.agreementRecId = data.fields.AGREEMENT_RECID__c.value;
        } else if (error) {
            console.error('Error fetching record:', JSON.stringify(error));
        }
        this.wiredLoading = false;
        this.onWiredEvent('wiredRecord')
    }

    @wire(getObjectInfo, { objectApiName: ContentVersion_OBJECT })
    ContentVersionInfo({ error, data }) {
        this.objectInfoLoading = true;
        if (data) {
            this.getContentVersionRecordTypeId(data);
        } else if (error) {
            console.error('Error retrieving object info:', JSON.stringify(error));
        }
        this.objectInfoLoading = false;
        this.onWiredEvent('ContentVersionInfo')
    }

    getContentVersionRecordTypeId(objectInfo) {
        const recordTypeInfos = objectInfo.recordTypeInfos;
        for (const recordTypeInfo in recordTypeInfos) {
            if (recordTypeInfos[recordTypeInfo].name === 'TLO Agreement') {
                this.contentVersionRecordTypeId = recordTypeInfos[recordTypeInfo].recordTypeId;
                break;
            }
        }
    }

    getDataSubTypePicklistValues(data) {
        if (data.picklistFieldValues && data.picklistFieldValues.Entity_Sub_Type__c) {
            let picklistValues = data.picklistFieldValues.Entity_Sub_Type__c.values;
            const filteredOptions = picklistValues.find(option => option.label === this.typeDescription);

            if (filteredOptions) {
                this.agreementDataSubTypeValue = filteredOptions.value;
                console.info('Matching picklist value found for typeDescription:', this.typeDescription);
            } else {
                console.error('No matching picklist value found for typeDescription:', this.typeDescription);
            }
        } else {
            console.error('Picklist values for Entity_Sub_Type__c are undefined.');
        }
    }


    @wire(getPicklistValuesByRecordType, { objectApiName: ContentVersion_OBJECT, recordTypeId: '$contentVersionRecordTypeId'})
    wiredDocumentTypeOptions({ error, data }) {
        this.documentTypeLoading = true;
        if (data) {
            this.contentVersionRecordTypeData = data;
            this.getDataSubTypePicklistValues(data);
            if (data.picklistFieldValues && data.picklistFieldValues.Document_Classification__c) {
                let picklistValues = data.picklistFieldValues.Document_Classification__c.values;

                this.documentTypeOptions = picklistValues.map(option => ({
                    label: option.label,
                    value: option.value
                }));
            } else {
                console.error('Picklist values are undefined.');
            }
        } else if (error) {
            console.error(error);
        }
        this.documentTypeLoading = false;
        this.onWiredEvent('wiredDocumentTypeOptions')
    }

    onWiredEvent(context) {
        if (this.contentVersionRecordTypeData) {
            this.getDataSubTypePicklistValues(this.contentVersionRecordTypeData);
        }
    }


    handleDocumentTypeOptionsChange(event) {
        this.selectedDocumentTypeOptions = event.detail.selectedDocumentTypeOptions;
    }


    //captures the retrieve event propagated from lookup component
    selectItemEventHandler(event) {
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        this.displayItem(args);
    }

    //captures the remove event propagated from lookup component
    deleteItemEventHandler(event) {
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        this.displayItem(args);
    }

    //displays the items in comma-delimited way
    displayItem(args) {
        this.values = [];
        args.map(element => {
            this.values.push(element.label);
        });

        this.isItemExists = (args.length > 0);
        this.selectedItemsToDisplay = this.values.join(', ');
    }

    wiredResult;
    // Handle upload success event
    handleUploadSuccess() {

    // Close the modal
    this.showModal = false;

    // Refresh the wired result to fetch the latest data
    return refreshApex(this.wiredResult);
    }

}

//////////////////////////////////////////////////////

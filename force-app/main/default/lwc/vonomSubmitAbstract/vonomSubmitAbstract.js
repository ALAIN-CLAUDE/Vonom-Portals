import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
const MAX_FILE_SIZE = 524288000;

export default class VonomSubmitAbstract extends LightningElement {
    @track isModalOpen = false;  // Tracks whether the modal is open
    @track filesData = [];

    handleOpenModal() {
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }

    removeFile(event) {
        let fileName = event.currentTarget.dataset.name;
        const index = this.filesData.findIndex(obj => obj.fileName === fileName);
        if (index !== -1) {
            this.filesData.splice(index, 1);
        }
    }

    handleFilesChange(event) {
        console.log('handleFilesChange called');
        const files = event.target.files;
        console.log('files:', files);
        console.log('files.length:', files.length);
    
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log('Processing file:', file.name);
    
                if (file.size > MAX_FILE_SIZE) {
                    console.log('File size exceeded');
                    this.showToast('Error!', 'error', 'File size exceeded. A file is larger than 500MB.');
                    return;
                }
    
                const fileType = file.type;
                const fileSize = this.getFileSize(file.size);
                console.log('fileSize:', fileSize);
    
                this.filesData.push({
                    fileName: file.name,
                    fileContent: file,
                    fileType: fileType,
                    fileSize: fileSize,
                    percentComplete: 0
                });
    
                console.log('File added:', file.name);
            }
        }
    
        console.log('this.filesData:', this.filesData);
        console.log('this.filesData length:', this.filesData.length);
    }
    

    getFileSize(fileInBytes) {
        if (!fileInBytes) return 'undefined size'
    
        let bytes = fileInBytes
        let sizes = ['bytes', 'KB', 'MB', 'GB', 'TB']
        if (bytes === 0) return '0 bytes'
        let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
    }

    showToast(title, variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                variant: variant,
                message: message,
            })
        );
    }
}

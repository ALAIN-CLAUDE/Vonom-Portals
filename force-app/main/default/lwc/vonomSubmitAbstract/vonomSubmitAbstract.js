import { LightningElement, track } from 'lwc';

export default class VonomSubmitAbstract extends LightningElement {
    @track isModalOpen = false;  // Tracks whether the modal is open

    handleOpenModal() {
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }
}

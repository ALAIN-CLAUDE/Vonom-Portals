import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AbstractsDisplayTable extends LightningElement {

    noFiles = false;
    loadError = false;
    
    data = [
    { id: '1', title: 'Abstract A', status: 'Under review', date: '2024-08-17' },
    { id: '2', title: 'Abstract B', status: 'Feedback given', date: '2024-08-15' },
    { id: '3', title: 'Abstract C', status: 'Published', date: '2024-08-14' },
];

columns = [
    { label: 'Title', fieldName: 'title', type: 'text' },
    { label: 'Status', fieldName: 'status', type: 'text' },
    { label: 'Date', fieldName: 'date', type: 'date' },
    {
        label: 'Action',
        type: 'button',
        typeAttributes: {
            label: { fieldName: 'actionLabel' },
            name: { fieldName: 'actionName' },
            variant: 'brand',
        },
        cellAttributes: {
            alignment: 'center',
        },
    },
];

connectedCallback() {
    this.data = this.data.map((row) => {
        let actionLabel = '';
        let actionName = '';

        if (row.status === 'Under review') {
            actionLabel = 'View';
            actionName = 'view';
        } else if (row.status === 'Feedback given') {
            actionLabel = 'Edit';
            actionName = 'edit';
        } else if (row.status === 'Published') {
            actionLabel = 'View';
            actionName = 'view';
        }

        return { ...row, actionLabel, actionName };
    });
}

handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;

    if (actionName === 'view') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'View Action',
                message: `Viewing ${row.title}`,
                variant: 'success',
            })
        );
    } else if (actionName === 'edit') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Edit Action',
                message: `Editing ${row.title}`,
                variant: 'success',
            })
        );
    }
}
}
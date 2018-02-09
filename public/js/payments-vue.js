const app = new Vue({
    el: "#app",
    data: {
        payments: kdfe.user.payments,
        payees: kdfe.user.payees,
        pageSize: 10,
        currentPage: 1
    },
    methods: {
        nextPage: function () {
            if (this.currentPage * this.pageSize < this.payments.length)
                this.currentPage++;
        },
        prevPage: function () {
            if (this.currentPage > 1) this.currentPage--;
        }
    },
    computed: {
        sortedPayments: function () {
            return this.payments
                .filter((row, index) => {
                    let start = (this.currentPage - 1) * this.pageSize;
                    let end = this.currentPage * this.pageSize;
                    if (index >= start && index < end) return true;
                });
        },
        pageInfo: function () {
            let startRecord = (this.currentPage - 1) * this.pageSize + 1;
            let endRecord = startRecord + this.pageSize - 1;
            endRecord = endRecord > this.payments.length ? this.payments.length : endRecord;
            return 'Displaying ' + startRecord + ' through ' + endRecord + ' of ' + this.payments.length + ' records.';
        }
    },
    filters: {
        payee: function (value) {
            let payeeData = kdfe.user.payees.filter(payee => {
                return payee._id == value;
            });
            return payeeData[0].name;
        },
        dateFormat: function (value) {
            return moment(value).format("D MMM YYYY");
        },
        currencyFormat: function (value) {
            return '$' + value.toFixed(2);
        }
    }
});
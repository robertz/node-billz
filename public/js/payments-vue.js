const app = new Vue({
    el: "#app",
    data: {
        hasPayments: false,
        payments: [],
        payees: [],
        pageSize: 10,
        currentPage: 1,
        prevEnable: false,
        nextEnable: false
    },
    created: function() {
        fetch('/api/user/' + kdfe.userid + '/payees')
            .then(res => res.json())
            .then(res => {
                this.payees = res;
            });
        fetch('/api/user/' + kdfe.userid + '/payments')
            .then(res => res.json())
            .then(res => {
                this.payments = res;
                this.hasPayments = res.length ? true : false;
            });
    },
    methods: {
        nextPage: function () {
            if (this.currentPage * this.pageSize < this.payments.length){
                this.currentPage++;
            }
            else {
            }
                
        },
        prevPage: function () {
            if (this.currentPage > 1){
                this.currentPage--;
            } 
            else {
            }
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
            return 'Displaying records ' + startRecord + ' through ' + endRecord + ' of ' + this.payments.length;
        }
    },
    filters: {
        payee: function (value, payees) {
            // The _this_ scope is not available, payee list has to be passed in as an argument
            let payeeData = payees.filter(payee => {
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
const app = new Vue({
    el: "#app",
    data() {
        return {
            stats: {
                total: 0,
                active: 0,
                amount: 0
            },
            payees: []
        }
    },
    created() {
        this.payees = window.kdfe.payees;
        this.stats.total = this.payees.length;
        let activePayees = this.payees.filter(payee => { return payee.active === true });
        this.stats.active = activePayees.length;
        this.stats.amount = activePayees.reduce((acc, payee) => acc + payee.amount, 0);
    },
    filters: {
        day: function(date) {
            return moment(date).format('Do');
        },
        apr: function(apr) {
            return apr ? apr.toFixed(2) + '%': '';
        }
    }
});
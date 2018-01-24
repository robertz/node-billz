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
        fetch('/api/user/' + userid + '/payees')
        .then(res => res.json())
        .then(res => {
            this.payees = res;
            this.stats.total = res.length;
            
            let activePayees = res.filter(payee => payee.active === true);

            this.stats.active = activePayees.length;
            this.stats.amount = activePayees.reduce((acc, payee) => acc + payee.amount, 0);

        });
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
Vue.use(Vuetable);

new Vue({
  el: "#app",
  components: {
    "vuetable-pagination": Vuetable.VuetablePagination,
    "vuetable-pagination-info": Vuetable.VuetablePaginationInfo
  },
  data: {
    hasPayments: false,
    fields: [
        "name", 
        {
            name: 'ref',
            title: 'Due',
            callback: 'formatDate'
        }, 
        {
            name: 'createdAt',
            title: 'Paid',
            callback: 'formatDate'
        }, 
        {
            name: 'amount',
            callback: 'formatCurrency'
        }
    ],
    apiUrl: '/api/user/' + window.kdfe.userid +'/paymentvue',
    sortOrder: [{ field: "name", direction: "asc" }],
    css: {
      table: {
        tableClass: "table table-striped table-bordered table-hovered",
        loadingClass: "loading",
        ascendingIcon: "glyphicon glyphicon-chevron-up",
        descendingIcon: "glyphicon glyphicon-chevron-down",
        handleIcon: "glyphicon glyphicon-menu-hamburger"
      },
      pagination: {
        infoClass: "pull-left",
        wrapperClass: "vuetable-pagination pull-right",
        activeClass: "btn-primary",
        disabledClass: "disabled",
        pageClass: "btn",
        linkClass: "btn",
        icons: {
          first: "",
          prev: "",
          next: "",
          last: ""
        }
      }
    }
  },
  computed: {
    /*httpOptions(){
    return {headers: {'Authorization': "my-token"}} //table props -> :http-options="httpOptions"
  },*/
  },
  methods: {
    formatDate(value, fmt) {
      if (value == null) return ''
      fmt = (typeof fmt == 'undefined') ? 'D MMM YYYY' : fmt
      return moment(value, 'YYYY-MM-DD').format(fmt)
    },
    formatCurrency(value) {
      return '$' + value.toFixed(2);
    },
    onPaginationData(paginationData) {
        this.hasPayments = paginationData.total > 0 ? true : false
        this.$refs.pagination.setPaginationData(paginationData);
        this.$refs.paginationInfo.setPaginationData(paginationData);
    },
    onChangePage(page) {
      this.$refs.vuetable.changePage(page);
    },
    onLoading() {
      console.log("loading... show your spinner here");
    },
    onLoaded() {
      console.log("loaded! .. hide your spinner here");
    }
  }
});

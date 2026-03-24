class Filters {
    constructor(page = 1, pageSize = 20, sort = 'id', sortSafelist = ['id', 'updatedAt', '-id', '-updatedAt']) {
        this.page = parseInt(page, 10) || 1;
        this.pageSize = parseInt(pageSize, 10) || 20;
        this.sort = sort;
        this.sortSafelist = sortSafelist;
    }

    limit() {
        return this.pageSize;
    }

    offset() {
        return (this.page - 1) * this.pageSize;
    }

    sortColumn() {
        for (let safeValue of this.sortSafelist) {
            if (this.sort === safeValue) return this.sort;
            if (this.sort === `-${safeValue}`) return safeValue;
        }
        return 'id';
    }

    // Determines ASC or DESC based on the '-' prefix
    sortDirection() {
        return this.sort.startsWith('-') ? 'DESC' : 'ASC';
    }

    validate(validator) {
        validator.check(this.page > 0, 'page', 'must be greater than zero');
        validator.check(this.page <= 10_000_000, 'page', 'must be a maximum of 10 million');
        validator.check(this.pageSize > 0, 'pageSize', 'must be greater than zero');
        validator.check(this.pageSize <= 100, 'pageSize', 'must be a maximum of 100');
        validator.check(
            this.sortSafelist.includes(this.sort), 
            'sort', 
            'invalid sort value'
        );
    }
}

// The metadata calculator
const calculateMetadata = (totalRecords, page, pageSize) => {
    if (totalRecords === 0) {
        return {};
    }
    return {
        currentPage: page,
        pageSize: pageSize,
        firstPage: 1,
        lastPage: Math.ceil(totalRecords / pageSize),
        totalRecords: totalRecords
    };
};

module.exports = { Filters, calculateMetadata };
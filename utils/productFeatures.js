class ProductFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
  
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'dateFrom', 'dateTo', 'productName', 'category'];
        excludedFields.forEach(el => delete queryObj[el]);
        
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        
        this.query = this.query.find(JSON.parse(queryStr));
        
        if (this.queryString.productName) {
            this.query = this.query.find({ 'productInfo.name': { $regex: this.queryString.productName, $options: 'i' } });
        }
        
        if (this.queryString.category) {
            this.query = this.query.find({ 'productInfo.category': { $regex: this.queryString.category, $options: 'i' } });
        }
        
        if (this.queryString.dateFrom || this.queryString.dateTo) {
            const dateFilter = {};
            
            if (this.queryString.dateFrom) {
                dateFilter.$gte = new Date(this.queryString.dateFrom);
            }
            
            if (this.queryString.dateTo) {
                dateFilter.$lte = new Date(this.queryString.dateTo);
            }
            
            this.query = this.query.find({ createdAt: dateFilter });
        }
        
        return this;
    }
  
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
  
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }
  
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
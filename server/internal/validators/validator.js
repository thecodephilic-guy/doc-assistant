class Validator {
    constructor() {
        this.errors = {};
    }

    /**
     * Returns true if the errors object is empty, false otherwise.
     */
    valid() {
        return Object.keys(this.errors).length === 0;
    }

    /**
     * Adds an error message for a specific field if it doesn't already exist.
     * @param {string} key - The field name (e.g., 'email', 'file').
     * @param {string} message - The error description.
     */
    addError(key, message) {
        if (!this.errors[key]) {
            this.errors[key] = message;
        }
    }

    /**
     * Checks a condition. If the condition is false, adds an error message.
     * @param {boolean} ok - The condition to check (should be true).
     * @param {string} key - The field name.
     * @param {string} message - The error message if check fails.
     */
    check(ok, key, message) {
        if (!ok) {
            this.addError(key, message);
        }
    }

    /**
     * Generic helper: Check if a value is in a list of permitted values.
     */
    static permittedValue(value, ...permittedValues) {
        return permittedValues.includes(value);
    }

    /**
     * Generic helper: Check if a string matches a regex.
     */
    static matches(value, rx) {
        return rx.test(value);
    }
}

module.exports = Validator;
/**
 * Hey Ian, this file is just here for my reference on form functionality.
 */

document.addEventListener("DOMContentLoaded", function() {
    const metersRadio = document.getElementById("meters-radio");
    const feetRadio = document.getElementById("feet-radio");
    const seatedRadio = document.getElementById("seated-radio");
    const standingRadio = document.getElementById("standing-radio");
    const form = document.getElementById('alignment-position-form');
    const xoffCheckbox = document.getElementById('xoff');

    function updateRadioValues() {
        if (metersRadio.checked) {
            seatedRadio.value = "1.26";
            standingRadio.value = "1.623";
        } else if (feetRadio.checked) {
            seatedRadio.value = "4.13";
            standingRadio.value = "5.32";
        }
    }
    metersRadio.addEventListener("change", updateRadioValues);
    feetRadio.addEventListener("change", updateRadioValues);

    updateRadioValues(); // Initialize the radio button values on page load

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const searchParams = new URLSearchParams(formData);
        if (!form.querySelector('#subConfigCheckbox').checked) {
            const fields = ["as", "abz", "sy", "axf", "axl", "az"]; // replace with actual ids of your inputs
            fields.forEach(field => {
                if (searchParams.has(field)) {
                    searchParams.delete(field);
                }
            });
        }

        if (!xoffCheckbox.checked) {
            searchParams.delete('ad');
        }

        window.location = form.getAttribute('action') + '?' + searchParams.toString();
    });
});
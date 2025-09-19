import React, { useEffect, useState } from 'react'
import DatePicker from "react-datepicker";
import PhoneInput from "react-phone-input-2";
import { me, requestLoan, checkMultipleLoans } from "../lib/api";

import 'react-phone-input-2/lib/style.css';
import "react-datepicker/dist/react-datepicker.css";

import { MdEmail } from "react-icons/md";
import { CiCalendar } from "react-icons/ci";
// import { set } from 'react-datepicker/dist/date_utils';


const LoanApplicationForm = ({ lender, lenderTerm, onLoanRequested,paymentMethod,paymentAccountId }) => {

    const initialPaybackDate = new Date();
    initialPaybackDate.setDate(initialPaybackDate.getDate() + 7);

    const [fee, setFee] = useState(0);
    const [total, setTotal] = useState(0);

    const [formData, setFormData] = useState({
        // name: lender.fullName || '',
        // email: lender.email || '',
        // phone: lender.phoneNumber || '',
        name: '',
        email: '',
        phone: '',
        amount: null,
        dateBorrowed: new Date(),
        paybackDate: initialPaybackDate,
        signature: '',
        dateSigned: new Date()
    })


    useEffect(() => {
        const { fee, total } = calculateLoanFee(formData.amount, formData.dateBorrowed, formData.paybackDate);
        // console.log(fee, total)

        fetchBorrower()

        setFee(fee);
        setTotal(total);
    }, [formData.amount, formData.dateBorrowed, formData.paybackDate])

    const fetchBorrower = async () => {
        try {
            const borrowerData = await me();
            setFormData(prev => ({
                ...prev,
                name: borrowerData.fullName || '',
                email: borrowerData.email || '',
                phone: borrowerData.phoneNumber || ''
            }));
        }
        catch (error) {
            console.error("Error fetching borrower data:", error);
            throw error;
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {

            // console.log("lenderid and lendertermid", lender.id, lenderTerm.id);

            await checkMultipleLoans({
                lenderId: lender.id,
                lenderTermId: lenderTerm.id
            });

            if(formData.amount >= lenderTerm.maxLoanAmount ){
                alert("enter amount less than max loan amount")
                return false
            }

            console.log(paymentAccountId,paymentMethod);
            
            const response = await requestLoan({
                lenderId: lender.id,
                amount: parseFloat(formData.amount),
                paybackDays: Math.ceil((formData.paybackDate - formData.dateBorrowed) / (1000 * 60 * 60 * 24)),
                signedBy: formData.signature, // Using signature as signedBy
                agreementText: generateAgreementText(),
                lenderTermId: lenderTerm.id || null,
                agreedPaymentAccountId:paymentAccountId,
                agreedPaymentMethod:paymentMethod
            });

            alert("Loan submitted successfully!");
            if (onLoanRequested) {
                onLoanRequested(response.loan);
            }
        } catch (error) {
            console.error(error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert("Something went wrong");
            }
        }
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const generateAgreementText = () => {
        return `I, ${formData.name}, on ${formatDate(formData.dateBorrowed)} agree to pay this loan of $${formData.amount} plus the fee of ${fee || 0}, for a total of ${total || 0}, to ${lender?.fullName || "the lender"} on or before ${formatDate(formData.paybackDate)}. If not paid by this date, I agree to pay an additional ${fee || 0} before any future loan will be granted.`;
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0]
    }

    const calculateLoanFee = (amount, borrowedDate, paybackDate) => {
        if (!amount || !borrowedDate || !paybackDate) return { fee: 0, total: amount };

        const oneDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.ceil((new Date(paybackDate) - new Date(borrowedDate)) / oneDay);

        // Use lender's fee rates if available, otherwise use defaults
        let feePer10Short = lenderTerm?.feePer10Short || 1;
        let feePer10Long = lenderTerm?.feePer10Long || 2;
        let loanMultiple = lenderTerm?.loanMultiple || 10;
        let maxPaybackDays = lenderTerm?.maxPaybackDays || 14;

        let ratePer10 = diffDays <= 7 ? feePer10Short : feePer10Long;
        let fee = (amount / loanMultiple) * ratePer10;

        if (diffDays > maxPaybackDays) {
            fee *= 2; // Double if exceeding max payback days
        }

        return {
            fee,
            total: amount + fee,
        };
    };

    return (
        <div className=' bg-[#002A38] font-noto-serif-jp p-14'>
            <div className="max-w-[708px] mx-auto bg-[#DAE3DE] rounded-lg px-7 py-2">
                <h1 className="text-center text-[#002A38] font-light py-3 text-md">Loan Request</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Borrower Information Section */}
                    <section>
                        <header className="bg-[#477891] text-white px-4 py-2 rounded-md">
                            <h2 className=" font-medium">Borrower Information</h2>
                        </header>

                        <div className=" py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#002A38] mb-1">
                                    Name: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-[#E7EDE9]"
                                    placeholder=""
                                    required
                                    disabled
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] mb-1">
                                        Email: <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center border border-gray-300 rounded-md bg-[#E7EDE9] px-2">
                                        <MdEmail className=' text-[#45646D]' />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="flex-1 px-3 py-2  focus:outline-none "
                                            placeholder=""
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] mb-1">
                                        Number: <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center border border-gray-300 rounded-md bg-[#E7EDE9]">
                                        <PhoneInput
                                            country={'us'}
                                            // onlyCountries={['us']}
                                            value={formData.phone}
                                            onChange={(phone) => handleInputChange('phone', phone)}
                                            inputProps={{
                                                name: 'phone',
                                                required: true,
                                            }}
                                            disabled
                                            containerClass="w-full"
                                            inputClass="!bg-[#E7EDE9] !border !border-gray-300 !rounded-md !py-2 !text-sm !focus:outline-none !w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Loan Details Section */}
                    <section>
                        <header className="bg-[#477891] text-white px-4 py-2 rounded-md">
                            <h2 className=" font-medium">Loan Details</h2>
                        </header>
                        <div className=" py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#002A38] mb-1">
                                    Loan Amount <span className="text-red-500">*</span>
                                </label>
                                {/* <p className="text-xs text-gray-500 mb-2">Up to ${lender?.lenderTerms?.maxLoanAmount || 100}</p> */}
                                <p className="text-xs text-gray-500 mb-2">Up to ${lenderTerm?.maxLoanAmount || 100}</p>
                                <input
                                    type="text"
                                    value={formData.amount || 0}
                                    onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-[#E7EDE9]"
                                    placeholder=""
                                    min={lenderTerm?.loanMultiple || 10}
                                    max={lenderTerm?.maxLoanAmount || 100}
                                    step={lenderTerm?.loanMultiple || 10}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] mb-1">
                                        Date Borrowed: <span className="text-red-500">*</span>
                                    </label>
                                    <div className='flex items-center w-fit border border-gray-300 rounded-md bg-[#E7EDE9] px-2'>
                                        <DatePicker
                                            selected={formData.dateBorrowed}
                                            onChange={(date) => handleInputChange('dateBorrowed', date)}
                                            dateFormat="MM/dd/yyyy"
                                            className="w-full py-2  focus:outline-none"
                                            minDate={new Date()}
                                            maxDate={new Date()}
                                            required
                                        />
                                        <CiCalendar className=' text-[#45646D]' />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] ">
                                        Payback Date: (Higher Fee after 1st week) <span className="text-red-500">*</span>
                                    </label>
                                    <div className='flex items-center w-fit border border-gray-300 rounded-md bg-[#E7EDE9] px-2'>
                                        <DatePicker
                                            selected={formData.paybackDate}
                                            onChange={(date) => handleInputChange('paybackDate', date)}
                                            dateFormat="MM/dd/yyyy"
                                            className="w-full py-2  focus:outline-none"
                                            minDate={new Date(formData.dateBorrowed.getTime() + 1 * 24 * 60 * 60 * 1000)}
                                            maxDate={new Date(formData.dateBorrowed.getTime() + (lenderTerm?.maxPaybackDays || 14) * 24 * 60 * 60 * 1000)}
                                            required
                                        />
                                        <CiCalendar className=' text-[#45646D]' />
                                    </div>

                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Loan Fee Section */}
                    <section>
                        <header className="bg-[#477891] text-white px-4 py-2 rounded-md">
                            <h2 className=" font-medium">Loan Fee - $<span>{fee}</span></h2>
                        </header>
                    </section>

                    {/* Loan Agreement Section */}
                    <section>
                        <header className="bg-[#477891] text-white px-4 py-2 rounded-md">
                            <h2 className=" font-medium">Loan Agreement</h2>
                        </header>

                        <div className=" py-4">
                            <p className="text-sm text-[#002A38]" onChange={() => handleInputChange(["aggrementText"])}>
                                I, {formData.name}, on {formatDate(formData.dateBorrowed)} agree to pay this loan of ${formData.amount} plus the fee of ${fee || 0}, for a total of ${total || 0}, to {lender?.fullName || 'the lender'} on or before {formatDate(formData.paybackDate)}. If not paid by this date, I agree to pay an additional ${fee || 0} before any future loan will be granted.
                            </p>
                        </div>
                    </section>

                    {/* Agreement Acknowledgement Section */}
                    <section>
                        <header className="bg-[#477891] text-white px-4 py-2 rounded-md">
                            <h2 className=" font-medium">Agreement Acknowledgement</h2>
                        </header>

                        <div className=" py-4 space-y-4">
                            <p className="text-sm text-[#002A38]">
                                I have read and understood the terms and conditions outlined in this Loan Form. I agree
                                to comply with these terms and accept responsibility.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] mb-1">
                                        Signature (Type Your Name Here) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.signature}
                                        onChange={(e) => handleInputChange('signature', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-[#E7EDE9]"
                                        placeholder=""
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#002A38] mb-1">
                                        Date Signed: <span className="text-red-500">*</span>
                                    </label>
                                    <div className='flex items-center w-fit border border-gray-300 rounded-md bg-[#E7EDE9] px-2'>
                                        <DatePicker
                                            selected={formData.dateSigned}
                                            onChange={(date) => handleInputChange('dateSigned', date)}
                                            minDate={new Date()}
                                            maxDate={new Date()}
                                            dateFormat="MM/dd/yyyy"
                                            className="w-full py-2 focus:outline-none"
                                            required
                                        />
                                        <CiCalendar className=' text-[#45646D]' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Submit Button */}
                    <div className="text-center pb-4">
                        <button
                            type="submit"
                            className="bg-[#477891] hover:bg-blue-600 text-white font-medium py-2 px-8 rounded-md transition-colors duration-200"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoanApplicationForm

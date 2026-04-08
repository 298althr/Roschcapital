import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { ArrowDownToLine, CheckCircle2, AlertCircle, Wallet, Upload, QrCode } from 'lucide-react';
import DepositModal from '../components/modals/DepositModal';

export const DepositPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch accounts
        const accountsRes = await apiClient.get('/accounts');
        if (accountsRes.success) {
          setAccounts(accountsRes.accounts);
          if (accountsRes.accounts.length > 0) {
            setSelectedAccount(accountsRes.accounts[0].id);
          }
        }
        
        // Fetch payment gateways
        const gatewaysRes = await apiClient.get('/gateways');
        if (gatewaysRes.success) {
          const activeGateways = gatewaysRes.gateways.filter(g => g.isActive);
          setGateways(activeGateways);
          if (activeGateways.length > 0) {
            setSelectedGateway(activeGateways[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load account and gateway information');
      }
    };

    fetchData();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccount || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('accountId', selectedAccount);
      formData.append('amount', parseFloat(amount));
      formData.append('description', description);
      formData.append('gatewayId', selectedGateway);
      if (paymentProof) {
        formData.append('paymentProof', paymentProof);
      }
      
      const response = await apiClient.post('/payments/deposit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.success) {
        setSuccess('Deposit request submitted! Awaiting admin approval.');
        setAmount('');
        setDescription('');
        setPaymentProof(null);
        setProofPreview('');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedGatewayDetails = gateways.find(g => g.id === selectedGateway);

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Deposit Funds</h1>
          <p className="text-sm text-neutral-600">Add money to your account</p>
        </div>

        {/* Start Deposit Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ArrowDownToLine className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Make a Deposit</h2>
            <p className="text-neutral-600 mb-8">
              Add funds to your account through our secure payment gateways
            </p>
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-600/30"
            >
              Start Deposit
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Deposit Information</h3>
              <p className="text-sm text-blue-700">
                Deposits require admin approval and will reflect in your account once verified.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        accounts={accounts}
      />
    </UserDashboardLayout>
  );
};

export default DepositPage;

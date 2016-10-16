-- phpMyAdmin SQL Dump
-- version 4.5.1
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Oct 16, 2016 at 03:58 PM
-- Server version: 10.1.13-MariaDB
-- PHP Version: 7.0.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `taxi`
--

-- --------------------------------------------------------

--
-- Table structure for table `engine_operation`
--

CREATE TABLE `engine_operation` (
  `peiod_id` int(11) NOT NULL,
  `engine_op_id` int(11) NOT NULL,
  `get_on_datetime` datetime NOT NULL,
  `get_off_datetime` datetime NOT NULL,
  `duration` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `gps`
--

CREATE TABLE `gps` (
  `id` int(11) NOT NULL,
  `taxi_id` varchar(45) DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `start_longitude` double DEFAULT NULL,
  `start_latitude` double DEFAULT NULL,
  `stop_datetime` datetime DEFAULT NULL,
  `stop_longitude` double DEFAULT NULL,
  `stop_latitude` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `long_waiting`
--

CREATE TABLE `long_waiting` (
  `period_id` int(11) NOT NULL,
  `long_waiting_id` int(11) NOT NULL,
  `get_off_datetime` datetime NOT NULL,
  `get_on_datetime` datetime NOT NULL,
  `duration` time NOT NULL,
  `distance` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `operation`
--

CREATE TABLE `operation` (
  `taxi_id` varchar(45) NOT NULL,
  `period_id` int(11) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `amount_km` int(11) NOT NULL,
  `hired_rate` float NOT NULL,
  `get_on_rate` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `over_speed`
--

CREATE TABLE `over_speed` (
  `period_id` int(11) NOT NULL,
  `over_speed_id` int(11) NOT NULL,
  `datetime` datetime NOT NULL,
  `speed` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `taxi_gps`
--

CREATE TABLE `taxi_gps` (
  `taxi_id` varchar(45) NOT NULL,
  `taxi_gps_id` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE `transaction` (
  `period_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `empty_distance` float NOT NULL,
  `get_on_datetime` datetime NOT NULL,
  `get_off_datetime` datetime NOT NULL,
  `paid_distance` float NOT NULL,
  `amount` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `gps`
--
ALTER TABLE `gps`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `gps`
--
ALTER TABLE `gps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
